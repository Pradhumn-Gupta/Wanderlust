const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schema.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

const validateReview = (req, res, next) => {
    console.log("Middleware Input:", req.body);
    if (!req.body.review) {
        return res.status(400).json({ error: "Review is required" });
    }
    next();
  };

//Post Review Route
router.post("/", validateReview, wrapAsync(async (req, res) => {
    console.log("Request Body:", req.body); // Debugging Log
    console.log("Review Data:", req.body.review);
    let listing = await Listing.findById(req.params.id);
    if (!req.body.review) {
      return res.status(400).json({ error: "Review data is missing in request body" });
    }
    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
  
    await newReview.save();
    await listing.save();
  
    res.redirect(`/listings/${listing._id}`);
}));
  
// Delete Review Route
router.delete("/:reviewId", wrapAsync(async (req,res) => {
    let {id, reviewId} = req.params;
    await Listing.findByIdAndUpdate(id, {$pull: {reviews : reviewId}});
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
}));

module.exports = router;