const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "LogIn To Create Listings!");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async(req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)) {
        req.flash("error", "You Don't Have Permission To Do So!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateListings = (req, res, next) => {
    console.log("Middleware Input:", req.body);
    if (!req.body.listing || Object.keys(req.body.listing).length === 0) {
        return res.status(400).json({ error: "Input Fields are required" });
    }
    next();
};

module.exports.validateReview = (req, res, next) => {
    console.log("Middleware Input:", req.body);
    if (!req.body.review) {
        return res.status(400).json({ error: "Review is required" });
    }
    next();
};

module.exports.isReviewAuthor = async(req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if(!review.author._id.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the Author of This Review!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};