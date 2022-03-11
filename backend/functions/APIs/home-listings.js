const { db } = require("../util/admin");
const firebase = require('firebase/compat/app');
require("firebase/compat/firestore");

exports.getAllHomeListings = (req, res) => {
    db.
        collection("homes")
        .get()
        .then(data => {
            let homes = [];
            data.forEach(doc => {
                homes.push({
                    homeId: doc.id,
                    ...doc.data()
                });
            });
            return res.json(homes);
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}

exports.getOneHomeListing = (req, res) => {
    const document = db.doc(`/homes/${req.params.id}`);
    document
        .get() 
        .then((doc) => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'HomeListing not found' })
            }
            return res.json(doc.data());
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code});
        })
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
    if (req.body.id || req.body.createdAt) {
        return res.status(400).json({ error: "Not allowed to edit" });
    }
    let document = db.collection("homes").doc(`${req.params.id}`);
    document.update(req.body)
        .then(() => {
            res.json({ message: 'Update successful' })
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code })
        })
}
