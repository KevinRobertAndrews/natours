const express = require("express");

const userController = require("./userController");
const authController = require("../controllers/authController");

const router = express.Router();

// PUBLIC ROUTES
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);

// PROTECTED ROUTES
router.use(authController.protect);

router.patch("/reset-password/:token", authController.resetPassword);
router.patch("/update-password/", authController.updatePassword);

router.get("/me", userController.getMe, userController.getUser);
router.patch(
  "/update-me",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete("/delete-me", userController.deleteMe);

// ADMIN ROUTES
router.use(authController.restrictTo("admin"));

router.route("/").get(userController.getAllUsers);
router.route("/create-user").post(userController.createOneUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
