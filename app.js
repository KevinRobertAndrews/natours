///////////////////////////////////////////////////////////////////
// NATOURS API - app.js

// 📝 app.js is the entry point into the application. It loads in
// 📝 Express.js and sets up the highest level middleware and routes

///////////////////////////////////////////////////////////////////

/* --- SETUP ---  */

const path = require("path");

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");

// Custom error handling
const AppError = require("./src/utils/appError");
const globalErrorHandler = require("./src/controllers/errorController");

// Routes
const viewRouter = require("./src/views/viewRoutes");
const tourRouter = require("./src/tours/tourRoutes");
const userRouter = require("./src/users/userRoutes");
const reviewRouter = require("./src/reviews/reviewRoutes");
const bookingRouter = require("./src/bookings/bookingRoutes");

/* --- APPLICATION ---  */

const app = express();

// Setup template engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "src/views"));

/* --- GLOBAL MIDDLEWARE ---  */

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP. Please try again in an hour",
});
app.use("/api", limiter);

// Based on body-parser, reads data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 🔒 Santize data against NOSQL query injection
app.use(mongoSanitize());

// 🔒 Santize data against XSS (cross site scripting attacks)
app.use(xss());

// 🔒 Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

app.use(compression());

// Custom middleware
app.use((req, res, next) => {
  //add a timestamp to the request
  req.requestTime = new Date().toISOString();

  // console.log(req.headers);

  // 📝 Don't forget to call next()!
  next();
});

/* --- ROUTES ---  */

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

// Handle all invalid routes
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl}`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
