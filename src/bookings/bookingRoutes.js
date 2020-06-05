const express = require("express");
const authController = require("../controllers/authController");
const bookingController = require("../bookings/bookingController");

const router = express.Router();

router.get(
  "/checkout-session/:tourId",
  authController.protect,
  bookingController.getCheckoutSession
);

router.use(authController.protect, authController.restrictTo("admin"));

router
  .route("/")
  .get(authController.protect, bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
