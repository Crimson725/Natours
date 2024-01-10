import express from "express";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getUser,
  createUser,
  getMe,
} from "../controllers/userController.js";
import {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  restrictTo,
} from "../controllers/authController.js";

const router = express.Router();
// for signup
router.post("/signup", signup);
// for login
router.post("/login", login);
//forgot password
router.post("/forgotPassword", forgotPassword);
//reset password
router.patch("/resetPassword/:token", resetPassword);

// protect all routes after this middleware
router.use(protect);
//update password
router.patch("/updateMyPassword", updatePassword);
// get current user's profile
router.get("/me", getMe, getUser);
// update profile
router.patch("/updateMe", updateMe);
// delete profile
router.delete("/deleteMe", deleteMe);

// restrict all routes after this middleware
router.use(restrictTo("admin"));
// for users
router.route("/").get(getAllUsers).post(createUser);
// for specific user
router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

export default router;
