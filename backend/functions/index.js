const functions = require("firebase-functions");
const auth = require('./util/auth');
const app = require("express")();
const cors = require("cors")({
    origin: "*"
});
app.use("*", cors);

const {
    getAllHomeListings,
    postOneHomeListing,
    deleteHomeListing,
    getOneHomeListing,
    editHomeListing
} = require('./APIs/home-listings');

const {
    loginUser,
    signUpUser,
    uploadProfilePhoto,
    getUserDetails,
    updateUserDetails,
    getImageUrl,
} = require('./APIs/users')


// listings APIs
app.get("/listings", getAllHomeListings);
app.get("/listing/:id",getOneHomeListing);
app.post("/listing", postOneHomeListing);
app.delete("/listing/:id", deleteHomeListing)
app.put('/listing/:id', editHomeListing)

// User APIs
app.post('/login', loginUser);
app.post('/signup', signUpUser);
app.post('/user/image', auth, uploadProfilePhoto);
app.get('/user', auth, getUserDetails);
app.post('/user', auth, updateUserDetails);
app.get('/user/imageUrl/:username', getImageUrl);


exports.api = functions.https.onRequest(app);
