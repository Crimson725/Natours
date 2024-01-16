import jsonwebtoken from "jsonwebtoken";
import { promisify } from "util";
import crypto from "crypto";
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../appError.js";
import Email from "../utils/email.js";

const signToken = (id) =>
  jsonwebtoken.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
      // convert to milliseconds
    ),
    // the secure option makes sure that the cookie is only sent on an encrypted connection, in HTTPS
    httpOnly: true,
    // cookie cannot be accessed or modified in any way by the browser
    secure: req.secure || req.headers("x-forward-proto") === "https",
  };
  // send with cookie
  res.cookie("jwt", token, cookieOptions);
  // remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, req, res);
});
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) check if user exists && password is correct
  const user = await User.findOne({ email: email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  // 3) if everything ok, send token to client
  createSendToken(user, 200, req, res);
});

const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    // the secure option makes sure that the cookie is only sent on an encrypted connection, in HTTPS
    httpOnly: true,
    // cookie cannot be accessed or modified in any way by the browser
  });
  res.status(200).json({ status: "success" });
};
const protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) Getting token and check of it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    // get token from cookie
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401),
    );
  }
  // 2) Verification token
  // promisify is a function that takes a function that uses callback and returns a function that returns a promise
  const decoded = await promisify(jsonwebtoken.verify)(
    token,
    process.env.JWT_SECRET,
  );
  if (!decoded) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401),
    );
  }
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401,
      ),
    );
  }
  // 4) Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401),
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});
// Only for rendered pages, no errors!
const isLoggedIn = catchAsync(async (req, res, next) => {
  let token;
  // 1) Getting token and check of it's there
  if (req.cookies.jwt && req.cookies.jwt !== "loggedout") {
    // get token from cookie
    token = req.cookies.jwt;
    const decoded = await promisify(jsonwebtoken.verify)(
      token,
      process.env.JWT_SECRET,
    );
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next();
    }
    if (currentUser.changePasswordAfter(decoded.iat)) {
      return next();
    }
    // THERE IS A LOGGED IN USER
    // pug have access to res.locals
    res.locals.user = currentUser;
    return next();
  }
  next();
});
const restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles as an array
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // deactivate all the validators for now
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host",
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (e) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(e);
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500,
    );
  }
});
const resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // greater than
  });
  //2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // always want to run all the validators
  await user.save();
  //3) Update changedPasswordAt property for the user

  //4) Log the user in, send JWT
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});
const updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  //2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }
  //3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!
  // don't use update for anything related to password
  //4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});
export {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
  isLoggedIn,
  logout,
};
