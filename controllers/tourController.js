import multer from "multer";
import sharp from "sharp";
import Tour from "../models/tourModel.js";
import catchAsync from "../utils/catchAsync.js";
import Booking from "../models/bookingModel.js";
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from "./handlerFactory.js";
import AppError from "../appError.js";

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Not an image! Please upload only images.", 400), false);
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
const uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 }, // 1 file
  { name: "images", maxCount: 3 }, // 3 files
]);

const resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }),
  );

  next();
});
const aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

const getAllTours = getAll(Tour);
const getTour = getOne(Tour, { path: "reviews" });
const createTour = createOne(Tour);
const updateTour = updateOne(Tour);
const deleteTour = deleteOne(Tour);
const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" }, // group by difficulty
        numTours: { $sum: 1 }, // add 1 for each document
        numRatings: { $sum: "$ratingsQuantity" }, // add ratingsQuantity for each document
        avgRating: { $avg: "$ratingsAverage" }, // average ratingsAverage for each document
        avgPrice: { $avg: "$price" }, // average price for each document
        minPrice: { $min: "$price" }, // minimum price for each document
        maxPrice: { $max: "$price" }, // maximum price for each document
      },
    },
    {
      $sort: { avgPrice: 1 }, // sort by avgPrice ascending
    },
    {
      $match: { _id: { $ne: "easy" } }, // filter out easy
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});
const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          // $gte: `${year}-01-01`,
          // $lte: `${year}-12-31`,
          $gte: new Date(`${year}-01-01`).toISOString(),
          $lte: new Date(`${year}-12-31`).toISOString(),
        },
      },
    },
    {
      $addFields: {
        startDatesConverted: { $toDate: "$startDates" },
      },
    },
    {
      $group: {
        _id: { $month: "$startDatesConverted" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" }, // add name to tours array, so we can see which tours start in each month
      },
    },
    {
      $addFields: {
        month: "$_id",
      },
    },
    {
      $project: {
        // use project to hide _id
        _id: 0, // hide _id
      },
    },
    {
      $sort: {
        numTourStarts: -1, // descending
      },
    },
    {
      $limit: 12, // only show 12 months
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});
const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params; // /tours-within/:distance/center/:latlng/unit/:unit
  const [lat, lng] = latlng.split(","); // split into array of strings
  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng.",
        400,
      ),
    );
  }
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1; // convert to radians
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius], // longitude first
      },
    },
  });
  res.status(200).json({
    status: "success",
    data: {
      results: tours.length,
      tours,
    },
  });
});
const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const multiplier = unit === "mi" ? 0.000621371 : 0.001; // convert to miles or kilometers
  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng.",
        400,
      ),
    );
  }
  const distances = await Tour.aggregate([
    {
      // need to use the geo index in the model
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1], // convert to number
        },
        distanceField: "distance", // field to create
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        // use project to hide _id
        distance: 1, // show distance
        name: 1, // show name
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      data: distances,
    },
  });
});
const getTourByName = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.tourName }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  res.status(200).json({
    status: "success",
    data: {
      data: tour,
    },
  });
});

const getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  const tourIds = bookings.map((el) => el.tour);

  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).json({
    status: "success",
    data: tours,
  });
});


export {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
  getTourByName,
  getMyTours,
};
