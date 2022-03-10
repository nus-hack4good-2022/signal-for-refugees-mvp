const functions = require("firebase-functions");
const app = require("express")();

const {
    getAllHomeListings,
    postOneHomeListing,
    deleteHomeListing,
} = require('./APIs/home-listings');

app.get("/listings", getAllHomeListings);
app.post("/listing", postOneHomeListing);
app.delete("/listing/:id", deleteHomeListing)

exports.api = functions.https.onRequest(app);
