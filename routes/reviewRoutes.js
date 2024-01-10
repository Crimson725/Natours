import express from "express";
import {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} from "../controllers/reviewController.js";
import { protect, restrictTo } from "../controllers/authController.js";
// mergeParams: true is needed to get access to tourId in reviewRoutes.js
const router = express.Router({ mergeParams: true });
router.use(protect);
router
  .route("/")
  .get(getAllReviews)
  .post(restrictTo("user"), setTourUserIds, createReview);

router
  .route("/:id")
  .delete(restrictTo("user", "admin"), deleteReview)
  .patch(restrictTo("user", "admin"), updateReview)
  .get(getReview);

export default router;
