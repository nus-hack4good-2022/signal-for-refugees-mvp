const functions = require("firebase-functions");
const app = require("express")();

const {
    getAllHomeListings,
    postOneHomeListing,
    deleteHomeListing,
    getOneHomeListing
} = require('./APIs/home-listings');

app.get("/listings", getAllHomeListings);
app.get("/listing/:id",getOneHomeListing);
app.post("/listing", postOneHomeListing);
app.delete("/listing/:id", deleteHomeListing)

exports.api = functions.https.onRequest(app);
