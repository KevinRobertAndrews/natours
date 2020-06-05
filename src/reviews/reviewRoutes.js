const express = require("express");
const authController = require("../controllers/authController");
const reviewController = require("../reviews/reviewController");

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// REST ROUTES
router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("admin", "user"),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo("admin", "user"),
    reviewController.deleteReview
  );

module.exports = router;
