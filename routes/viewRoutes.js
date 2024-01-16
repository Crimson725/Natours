import express from "express";
import {
  getLoginForm,
  getOverview,
  getTour,
  getSignUpForm,
  getAccount,
  updateUserData,
  getMyTours,
} from "../controllers/viewsController.js";
import { isLoggedIn, protect } from "../controllers/authController.js";
import alerts from "../public/js/alerts.js";

const router = express.Router();
router.use(alerts);
// routes
router.get("/", isLoggedIn, getOverview);
router.get("/tour/:slug", isLoggedIn, getTour);
router.get("/login", isLoggedIn, getLoginForm);
router.get("/signup", isLoggedIn, getSignUpForm);
router.get("/me", protect, getAccount);
router.get("/my-tours", protect, getMyTours);
router.post("/submit-user-data", protect, updateUserData);
export default router;
