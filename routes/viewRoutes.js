import express from "express";
import {
  getLoginForm,
  getOverview,
  getTour,
  getSignUpForm,
} from "../controllers/viewsController.js";

const router = express.Router();

// routes
router.get("/", getOverview);
router.get("/tour/:slug", getTour);
router.get("/login", getLoginForm);
router.get("signup", getSignUpForm);
export default router;
