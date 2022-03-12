const { admin, db } = require("../util/admin");
const firebase = require('firebase/compat/app');
require("firebase/compat/firestore");

exports.getAllHomeListings = (req, res) => {
    db.
        collection("homes")
        .orderBy("createdAt", "desc")
        .get()
        .then(data => {
            let homes = [];
            data.forEach(doc => {
                let is_request_accepted = 0;
                doc.data().requests.forEach(request => {
                    if (request.isAccepted == 1) {
                        is_request_accepted = 1;
                    }
                });
                if (is_request_accepted == 0) {
                    homes.push({
                        homeId: doc.id,
                        ...doc.data()
                    });
                }
            });
            return res.json(homes);
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}

exports.getOneHomeListing = (req, res) => {
    if (req.params.id) {
        const listingId = req.params.id;
        db.doc(`/homes/${listingId}`)
            .get()
            .then(doc => {
                if (doc.exists) {
                    let hasRequested = false;
                    let requestStatus;
                    doc.data().requests.forEach(request => {
                        if (request.username === req.user.username) {
                            hasRequested = true;
                            requestStatus = request.isAccepted;
                        }
                    });

                if (hasRequested) {
                    // users who request for a home can see the status of their request
                    return res.json({
                        homeId: doc.id,
                        title: doc.data().title,
                        description: doc.data().description,
                        location: doc.data().location,
                        numBedroom: doc.data().numBedroom,
                        numBathroom: doc.data().numBathroom,
                        owner: doc.data().owner,
                        createdAt: doc.data().createdAt,
                        type: doc.data().type,
                        tenant: doc.data().tenant,
                        requestStatus: requestStatus
                    });
                } else {
                    // users who view their own home can see their requestors
                    if (req.user.username === doc.data().owner) {
                        console.log(req.user.username);
                        return res.json({
                            homeId: doc.id,
                            requests: doc.data().requests,
                            ...doc.data(),
                        });
                    } else {
                    // users who don't request for the home can't see requestStatus
                        return res.json({
                            homeId: doc.id,
                            title: doc.data().title,
                            description: doc.data().description,
                            location: doc.data().location,
                            numBedroom: doc.data().numBedroom,
                            numBathroom: doc.data().numBathroom,
                            owner: doc.data().owner,
                            createdAt: doc.data().createdAt,
                            type: doc.data().type,
                            tenant: doc.data().tenant,
                        });
                    }
                }
            }
        })
            .catch(err => {
                console.error(err);
                return res.status(500).json({ error: err.code });
            });
    } else {
        return res.status(400).json({ error: "Must provide homeId" }); 
    }
}

exports.postOneHomeListing = (req, res) => {
    if (req.body.title.trim() === "") {
        return res.status(400).json({ error: "Must not be empty" });
    }
    if (req.body.numBathroom <= 0 || !req.body.numBathroom) {
        return res.status(400).json({ error: "Invalid input for numBathroom" });
    }
    if (req.body.numBedroom <= 0 || !req.body.numBedroom) {
        return res.status(400).json({ error: "Invalid input for numBathroom" });
    }
    if (!req.body.location || req.body.location.trim() === "") {
        return res.status(400).json({ error: "Must provide location" });
    }

    const newHomeListing = {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location, 
        numBathroom: req.body.numBathroom,
        numBedroom: req.body.numBedroom,
        createdAt: new Date().toISOString(),
        type: req.body.type,
        requests: [],
        owner: req.user.username,
        tenant: null
    }

    db.collection("homes")
        .add(newHomeListing)
        .then(doc => {
            const responseHomeListing = newHomeListing;
            responseHomeListing.id = doc.id; // let the firebase database generate the id
            return res.json(responseHomeListing);
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}

exports.deleteHomeListing = (req, res) => {
    const document = db.doc(`/homes/${req.params.id}`);
    document
        .get() 
        .then((doc) => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'HomeListing not found' })
            }
            if (doc.data().owner !== req.user.username) {
                return res.status(403).json({ error: 'Unauthorized' })
            }
            return document.delete();
        })
        .then(() => {
            res.json({ message: 'Delete successful' })
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code })
        })
}

exports.editHomeListing = (req, res) => {
    if (req.body.id || req.body.createdAt || req.body.owner || req.body.tenant || req.body.requests) {
        return res.status(400).json({ error: "Not allowed to edit" });
    }
    let document = db.collection("homes").doc(`${req.params.id}`);

    document.get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'HomeListing not found' })
            }
            if (doc.data().owner !== req.user.username) {
                return res.status(403).json({ error: 'Unauthorized' })
            }
        });

    document.update(req.body)
        .then(() => {
            res.json({ message: 'Update successful' })
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code })
        })
}

exports.makeRequestToHome = (request, response) => {
    const newRequest = {
        username: request.user.username,
        isAccepted: -1,
        message: request.body.message,
    }
    let document = db.collection('homes').doc(`${request.params.id}`);
    
    // checks for the existence of the home, or whether the request is being made to user's own home
    document.get()
    .then((doc) => {
        if (!doc.exists) {
            return response.status(404).json({ error: 'Home not found' });
        }
        if (doc.data().owner == request.user.username) {
            return response.status(401).json({ error: 'You cannot request your own home' })
        }
    });

    // checks whether the requestor has already requested the home
    document.get()
    .then((doc) => {
        doc.data().requests.forEach((requestor) => {
            if (requestor.username == request.user.username) {
                return response.status(401).json({ error: 'You have already requested this home' })
            }
        });
    });
    // adds the request to the requestors field
    document.update({
        requests: admin.firestore.FieldValue.arrayUnion(newRequest)
    })
    .then(() => {
        response.json({message: 'Request success'})
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err.code });
    });
};

exports.acceptRequest = (request, response) => {
    let document = db.collection('homes').doc(`${request.params.id}`);
    // checks for the existence of the home, or whether the request is being made to user's own home
    // checks if the username is valid
    document.get()
    .then((doc) => {
        if (!doc.exists) {
            return response.status(404).json({ error: 'Home not found' });
        }
        if (doc.data().owner != request.user.username) {
            return response.status(401).json({ error: 'You are unauthorised to accept requests posted by others' })
        }

        let requestor_found = 0;
        doc.data().requests.forEach((requestor) => {
            if (requestor.username === request.body.requestor_username) {
                requestor_found = 1
            }
        })
        if (requestor_found == 0) {
            return response.status(404).json({ error: 'Requestor not found' });
        }
    });


    // Iterate through the requestors array, and change the isAccepted field of the request where the requestor's username matches the parameter username
    document.get()
    .then((doc) => {
        doc.data().requests.forEach((requestor) => {
            if (requestor.username === request.body.requestor_username) {
                requestorToAccept = {...requestor, isAccepted: 1}
                document.update({
                    requests: admin.firestore.FieldValue.arrayRemove(requestor)
                });
                document.update({
                    requests: admin.firestore.FieldValue.arrayUnion(requestorToAccept),
                    tenant: request.body.requestor_username
                });
            }
            else {
                requestorToAccept = {...requestor, isAccepted: 0}
                document.update({
                    requests: admin.firestore.FieldValue.arrayRemove(requestor)
                });
                document.update({
                    requests: admin.firestore.FieldValue.arrayUnion(requestorToAccept)
                });
            }
            ownerRef = db.collection('users').doc(doc.data().owner);
            ownerRef.get()
            .then(() => {
                ownerRef.update({
                    homesProvided: admin.firestore.FieldValue.arrayUnion({
                        date: new Date(),
                        title: doc.data().title,
                        id: doc.id,
                        tenant: request.body.requestor_username,
                        location: doc.data().location,
                    })
                })
            })
        });
    })
    .then(() => {
            response.json({message: 'Request accepted'})
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err.code });
    });
}

exports.rejectRequest = (request, response) => {
    let document = db.collection('homes').doc(`${request.params.id}`);
    // checks for the existence of the home, or whether the request is being made to user's own home
    document.get()
    .then((doc) => {
        if (!doc.exists) {
            return response.status(404).json({ error: 'Home not found' });
        }
        if (doc.data().owner != request.user.username) {
            return response.status(401).json({ error: 'You are unauthorised to reject requests posted by others' })
        }

        let requestor_found = 0;
        doc.data().requests.forEach((requestor) => {
            if (requestor.username === request.body.requestor_username) {
                requestor_found = 1
            }
        })
        if (requestor_found == 0) {
            return response.status(404).json({ error: 'Requestor not found' });
        }
    });

    document.get()
    .then((doc) => {
        doc.data().requests.forEach((requestor) => {
            if (requestor.username === request.body.requestor_username) {
                requestorToReject = {...requestor, isAccepted: 0}
                document.update({
                    requests: admin.firestore.FieldValue.arrayRemove(requestor)
                });
                document.update({
                    requests: admin.firestore.FieldValue.arrayUnion(requestorToReject)
                });
            }
        });
    })
    .then(() => {
        response.json({message: 'Request rejected'})
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err.code });
    });
}
