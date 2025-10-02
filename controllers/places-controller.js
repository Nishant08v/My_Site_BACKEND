const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");
const fs = require('fs');


const getPlaceById = async (req, res, next) => {
  console.log("Get request in places");
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Something Went Wrong!!", 500);
    return next(error);
  }
  if (!place) {
    const error = new HttpError(
      "Could Not Find Place For The Given Place Id",
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  console.log(userId);
  let userWithPlaces;
  try {
    userWithPlaces = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError("Fetching Places Failed", 500);
    return next(error);
  }
  if (!userWithPlaces || userWithPlaces.length === 0) {
    return next(
      new HttpError("Could Not Find Place For The Given User Id", 404)
    );
  }
  res.json({ places: userWithPlaces.map((p) => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    throw new HttpError("Invalid Inputs Passed", 422);
  }
  const { title, description, address, creator } = req.body;
  let coords;
  //using OPENSTREETMAP's NominatimAPI
  try {
    coords = await getCoordsForAddress(address);
    //res.json(coords);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  const createdPlace = new Place({
    title,
    description,
    location: coords,
    address,
    creator,
    image: req.file.path,
  });
  //for checking about presence of user
  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    return next(
      new HttpError("could not create a place, Something Went Wrong", 500)
    );
  }
  if (!user) {
    const error = new HttpError("Could Not Find user for provided id", 404);
    return next(error);
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Creating Place Failed!!", 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    throw new HttpError("Invalid Inputs Passed", 422);
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something Went wrong, Couldn't update place",
      500
    );
    return next(error);
  }
  if(place.creator.toString() !== req.userData.userId){
         const error = new HttpError(
      "You are not Allowed to update Place",401
    );
    return next(error);
  }
  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    return next(new HttpError("Something Went wrong", 500));
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError("Something Went , couldn't delete place", 500);
    return next(error);
  }
  if(!place){
    return next(new HttpError("couldn't find place for the given place id",404));
  }
  if(place.creator.id !== req.userData.userId){
         const error = new HttpError(
      "You are not Allowed to delete Place",401
    );
    return next(error);
  }
  const imagePath = place.image;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({session : sess});
    place.creator.places.pull(place);
    await place.creator.save({session : sess});
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something Went Wrong!, couldn't delete place",
      500
    );
    return next(error);
  }
  fs.unlink(imagePath, (err)=>{
    console.log(err);
  })
  res.status(200).json({ message: "Place Deleted!" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
