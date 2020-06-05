const express = require("express");
const viewController = require("./viewController");
const authController = require("../controllers/authController");
const bookingController = require("../bookings/bookingController");

const router = express.Router();

router.get(
  "/",
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);
router.get("/tour/:slug", authController.isLoggedIn, viewController.getTour);
router.get("/login", authController.isLoggedIn, viewController.getLoginForm);
router.get("/me", authController.protect, viewController.getAccount);
router.get("/my-tours", authController.protect, viewController.getMyTours);
router.get("/signup", viewController.getSignupForm);

router.post(
  "/submit-user-data",
  authController.protect,
  viewController.updateUserData
);

module.exports = router;
