const express = require("express");
const tourController = require("./tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("../reviews/reviewRoutes");

// 📝 Notice the use of the generic name 'router'
const router = express.Router();

// Mounting nested route
router.use("/:tourId/reviews", reviewRouter);

// 📝 You can setup routes that grab a paramenter right from the route!
// router.param('id', tourController.checkId);

/////////////////////////////////////////////////////////////////////
// ALIAS ROUTES

router.route("/tours-stats").get(tourController.getTourStats);

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
  .route("/tours-within/:distance/center/:latlong/unit/:unit")
  .get(tourController.getToursWithin);

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan
  );

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

/////////////////////////////////////////////////////////////////////
// REST ROUTES

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    tourController.deleteTour
  );

module.exports = router;
