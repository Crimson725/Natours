import Review from "../models/reviewModel.js";
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from "./handlerFactory.js";

const getAllReviews = getAll(Review);

const setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};
const createReview = createOne(Review);
const deleteReview = deleteOne(Review);
const updateReview = updateOne(Review);
const getReview = getOne(Review);
export {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  getReview,
  setTourUserIds,
};
