import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // this only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  // active is for deactivating user
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
// instance method
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.createPasswordResetToken = function () {
  // create random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  // encrypt the reset token
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // set the expiration time
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes to expire
  return resetToken;
};
// check if user changed password after the token was issued
userSchema.methods.changePasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    console.log(JWTTimeStamp, changedTimeStamp);
    return JWTTimeStamp < changedTimeStamp;
  }
  // false means NOT changed
  return false;
};
userSchema.pre("save", function (next) {
  // isNew means this is a new document
  if (!this.isModified("password") || this.isNew) return next();
  // -1000 means that it's possible that the token is issued before the password is changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// middleware
userSchema.pre("save", async function (next) {
  // only run this function if password was actually modified
  if (!this.isModified("password")) return next();
  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
