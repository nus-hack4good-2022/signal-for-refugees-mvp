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
    editHomeListing,
    makeRequestToHome,
    acceptRequest,
    rejectRequest
} = require('./APIs/home-listings');

const {
    loginUser,
    signUpUser,
    uploadProfilePhoto,
    getUserDetails,
    updateUserDetails,
    getImageUrl,
    getAnotherUserDetails
} = require('./APIs/users')

const {
    postSingleChat,
    sendMessage,
    getAllChats
} = require('./APIs/chats')


// listings APIs
app.get("/listings", getAllHomeListings);
app.get("/listing/:id", auth, getOneHomeListing);
app.post("/listing", auth, postOneHomeListing);
app.delete("/listing/:id", auth, deleteHomeListing)
app.put('/listing/:id', auth, editHomeListing);
app.put('/listing/:id/request', auth, makeRequestToHome);
app.put('/listing/:id/request/accept', auth, acceptRequest);
app.put('/listing/:id/request/reject', auth, rejectRequest);

// User APIs
app.post('/login', loginUser);
app.post('/signup', signUpUser);
app.post('/user/image', auth, uploadProfilePhoto);
app.get('/user', auth, getUserDetails);
app.post('/user', auth, updateUserDetails);
app.get('/user/imageUrl/:username', getImageUrl);
app.get('/user/:username', getAnotherUserDetails);

// Chats
app.post('/chats', auth, postSingleChat);
app.put('/chats/:chatId', auth, sendMessage);
app.get('/chats/:username', auth, getAllChats);

exports.api = functions.https.onRequest(app);
