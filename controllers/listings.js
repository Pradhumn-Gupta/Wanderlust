const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({
      path : "reviews",
      populate: {
      path : "author",
    }}).populate("owner");
    if(!listing) {
      req.flash("error", "Listing you requested for does not exist");
      res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;
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
  newListing.owner = req.user._id;
  newListing.image = {url, filename};
  await newListing.save();
  req.flash("success", "New Listing Created Successfully!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
      req.flash("error", "Listing you requested for does not exist");
      res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let updatedData = {
      ...req.body.listing, // Spread other listing fields
      image: {
          filename: req.body.listing.image.filename, 
          url: req.body.listing.image.url
      }
    };
    await Listing.findByIdAndUpdate(id, { $set: updatedData }, { new: true, runValidators: true });
    req.flash("success", "Listing Updated Successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted Successfully!");
    res.redirect("/listings");
};