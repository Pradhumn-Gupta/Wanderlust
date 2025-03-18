const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const engine = require('ejs-mate');
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', engine);
app.use(express.static(path.join(__dirname, '/public')));

app.get("/", (req, res) => {
    res.send("Hi, I am root");
});

const validateListings = (req, res, next) => {
  console.log("Middleware Input:", req.body);
  if (!req.body.review) {
      return res.status(400).json({ error: "Input Fields are required" });
  }
  next();
}

const validateReview = (req, res, next) => {
  console.log("Middleware Input:", req.body);
  if (!req.body.review) {
      return res.status(400).json({ error: "Review is required" });
  }
  next();
};

// Index Route
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));

// New Route
app.get("/listings/new", wrapAsync((req, res) => {
  res.render("listings/new.ejs");
}));

// Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", { listing });
}));

// Create Route
app.post("/listings", wrapAsync(async (req, res, next) => {
  const newListing = new Listing({
    title: req.body.listing.title,
    description: req.body.listing.description,
    image: {
      filename: req.body.listing.image.filename || 'listingimage',
      url: req.body.listing.image.url || 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60'
    },
    price: req.body.listing.price,
    country: req.body.listing.country,
    location: req.body.listing.location,
  });
  if(!newListing.title){
    throw new ExpressError(400, "Title is Missing");
  }
  if(!newListing.description){
    throw new ExpressError(400, "Description is Missing");
  }
  if(!newListing.price){
    throw new ExpressError(400, "Price is Missing");
  }
  if(!newListing.location){
    throw new ExpressError(400, "Location is Missing");
  }
  if(!newListing.country){
    throw new ExpressError(400, "Country is Missing");
  }
  await newListing.save();
  res.redirect("/listings");
}));
  
// Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
}));
  
// Update Route
app.put("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { $set: req.body.listing });
  res.redirect(`/listings/${id}`);
}));
  
// Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

//Reviews
//Post Review Route
app.post("/listings/:id/reviews", validateReview, wrapAsync(async (req, res) => {
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
app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req,res) => {
  let {id, reviewId} = req.params;
  await Listing.findByIdAndUpdate(id, {$pull: {reviews : reviewId}});
  await Review.findByIdAndDelete(reviewId);
  res.redirect(`/listings/${id}`);
}));

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err); // Prevents multiple responses
  }
  let { statusCode = 500, message = "Something Went Wrong!" } = err;
  res.status(statusCode).render("error.ejs", {message});
  // res.status(statusCode).send(message);
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});