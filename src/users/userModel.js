const crypto = require("crypto");

const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

/////////////////////////////////////////////////////
// SCHEMA

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
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    //  🚩🔒 Hide property from showing up in output
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on .create() or .save()!!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

/////////////////////////////////////////////////////
// MIDDLEWARE

// Hash password
userSchema.pre("save", async function (next) {
  // Only run if password is modified
  if (!this.isModified("password")) return next();

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete passwordConfirm field
  this.passwordConfirm = undefined;

  next();
});

// Do a thing??
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // .this points to the curret query
  this.find({ active: { $ne: false } });
  next();
});

/////////////////////////////////////////////////////
// INSTANCE METHODS

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  // false means NOT changed.
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // 🔒 Never store unencrpyted resetToken in the database.
  const resetToken = crypto.randomBytes(32).toString("hex");
  // Encrypt resetToken
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

/////////////////////////////////////////////////////
// EXPORT

const User = mongoose.model("User", userSchema);

module.exports = User;
