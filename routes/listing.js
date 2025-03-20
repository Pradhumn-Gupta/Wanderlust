const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const Listing = require("../models/listing.js");

router.use(express.urlencoded({ extended: true }));

const validateListings = (req, res, next) => {
    console.log("Middleware Input:", req.body);
    if (!req.body.listing || Object.keys(req.body.listing).length === 0) {
        return res.status(400).json({ error: "Input Fields are required" });
    }
    next();
}

// Index Route
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));

// New Route
router.get("/new", wrapAsync((req, res) => {
  res.render("listings/new.ejs");
}));

// Show Route
router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", { listing });
}));

// Create Route
router.post("/", validateListings, wrapAsync(async (req, res, next) => {
  const newListing = new Listing({
    title: req.body.listing.title,
    description: req.body.listing.description,
    image: {
      filename: req.body.listing.image?.filename || 'listingimage',
      url: req.body.listing.image?.url || 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60'
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
router.get("/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
}));
  
// Update Route
router.put("/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  let updatedData = {
    ...req.body.listing, // Spread other listing fields
    image: {
        filename: req.body.listing.image.filename, 
        url: req.body.listing.image.url
    }
  };
  await Listing.findByIdAndUpdate(id, { $set: updatedData }, { new: true, runValidators: true });
  res.redirect(`/listings/${id}`);
}));
  
// Delete Route
router.delete("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

module.exports = router;