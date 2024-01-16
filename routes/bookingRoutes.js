import express from "express";
import { protect, restrictTo } from "../controllers/authController.js";
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getBooking,
  getCheckoutSession,
  updateBooking,
} from "../controllers/bookingController.js";

const router = express.Router();
router.use(protect);
router.get("/checkout-session/:tourId", getCheckoutSession);
router.use(restrictTo("admin", "lead-guide"));
router.route("/").get(getAllBookings).post(createBooking);
router.route("/:id").get(getBooking).delete(deleteBooking).patch(updateBooking);

export default router;
