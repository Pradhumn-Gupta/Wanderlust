const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const engine = require('ejs-mate');
const { reviewSchema } = require("./schema.js");
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

const validateReview = (req, res, next) => {
  let {error} = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message.join(","));
    throw new ExpressError(400, errMsg);
  }else{
    next();
  }
}

// Index Route
app.get("/listings", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
});

// New Route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// Show Route
app.get("/listings/:id", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
});

// Create Route
app.post("/listings", async (req, res, next) => {
  try{
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
  await newListing.save();
  res.redirect("/listings");
  } catch(err) {
    next(err)
  }
  
});
  
// Edit Route
app.get("/listings/:id/edit", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
});
  
// Update Route
app.put("/listings/:id", async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing.title, ...req.body.listing.description, ...req.body.listing.image, ...req.body.listing.price, ...req.body.listing.location, ...req.body.listing.country });
    res.redirect(`/listings/${id}`);
});
  
// Delete Route
app.delete("/listings/:id", async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
});

//Reviews
//Post Route
app.post("/listings/:id/reviews", async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
});

app.use((err , req , res , next) => {
  res.send("Something went Wrong");
})

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});