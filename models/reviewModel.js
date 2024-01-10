import mongoose from "mongoose";
import Tour from "./tourModel.js";

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // parent referencing
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    // parent referencing
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
// prevent duplicate reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0, // reset to 0
      ratingsAverage: 4.5, // reset to 4.5
    });
  }
};
reviewSchema.post("save", function (next) {
  this.constructor.calcAverageRatings(this.tour);
  next();
});
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this is the current query
  this.r = await this.clone().findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function (next) {
  // this is the current query
  // pass data from pre middleware to post middleware
  await this.r.constructor.calcAverageRatings(this.r.tour);
  next();
});
const Review = mongoose.model("Review", reviewSchema);

export default Review;
