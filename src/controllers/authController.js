// Node Modules /////
const { promisify } = require("util");
const crypto = require("crypto");

// Third-Party Modules /////
const jwt = require("jsonwebtoken");

// Custom Modules /////
const AppError = require("../utils/appError");
const User = require("../users/userModel");
const catchAsync = require("../utils/catchAsync");
const Email = require("../utils/email");
const signToken = require("../utils/signToken");

// Helper
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // 🔒 We use httpOnly to make sure that the cookie is stored in the browser
    // and that it cannot be further manipulated. So what about logging the user out?
    // We send the user a new cookie with the same name, but no token. So it overwrites
    // the original token!
    httpOnly: true,
  };

  // 🔒 coookieOptions.secure = true when we are in production because
  // we only want to send cookies over HTTPS.
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

/////////////////////////////////////////////////////
// AUTH CONTROLLERS

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get("host")}:3000/me`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email && password exist.
  if (!email || !password) {
    return next(new AppError("Please provide email and password!"), 400);
  }

  // 2) Check if email && password are correct.
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    // 📝 Nice trick!
    // 📝   If !user => error
    // 📝   If user, but !password => error
    // 📝   If user and password, create token!
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything okay, send token to client.
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "not.logged.in", {
    expires: new Date(Date.now() + 10000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Validation: Check if token exists
  // 📝 Define here token first, otherwise it would
  // be block scoped inside the if statement
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    // 📝 We RETURN with next() because we want to exit the middleware
    return next(
      new AppError("You are not logged in. Please log in to get access.", 401)
    );
  }

  // 🔒 Important security step
  // 2. Verification: Check token has not been tampered with
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. If validation was successful, check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists."),
      401
    );
  }

  // 4. Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password. Please log in again.", 401)
    );
  }

  // 📝 If there are no problems caught, this middleware will
  // append the current user to the request object and move on
  // to the next, now protected route.
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

// Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3. If validation was successful, check if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // 4. Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // If everything is good, we make the user accessable to our templates.
      // res.locals is for passing data to pug. Now all the templates will have
      // a user object
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      // If there's an error, move on.
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  // 📝 This is a closure. A decorator? We cannot input arguments
  // into middleware, so we wrap it!! So cool!!
  return (req, res, next) => {
    // 📝 If we've gotten this far, it's because .protect()
    // completed and passed on the current user in the request object
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }

    next();
  };
};

// RE-STUDY THIS
exports.forgotPassword = async (req, res, next) => {
  // 1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with that email address.", 404));
  }

  // 2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to the user's email.
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/reset-password/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later.",
        500
      )
    );
  }
};

// RE-STUDY THIS
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token.
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired.", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. Updated changedPasswordAt property for the user

  // 4. Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  // 📝 We have a req.user object because .updatePassword() will run
  // after .protect()
  const user = await User.findById(req.user.id).select("+password");

  // 2. Check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is not correct.", 401));
  }
  // 3. If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work here.

  // 4. Log user in, send JWT
  createSendToken(user, 200, res);
});
