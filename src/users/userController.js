const multer = require("multer");
const sharp = require("sharp");

const User = require("./userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const factory = require("../controllers/handlerFactory");

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     // user-{userid}-{timestamp}.jpg
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
// Now the multerStorage stores the file as a buffer
// so that we can save the processed image instead.
const multerStorage = multer.memoryStorage();

// This filter is to make sure users only upload JPEG.
// It could be configured to test for whatever file type you want.
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image. Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // Read the photo from memory
  // ✏️ TODO: Check out the docs on Sharp. It's really cool
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// Helper funciton
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

////////////////////////////////////////////////////////
// REST ROUTES

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.createOneUser = factory.createOne(User);

// ⚠️ Do NOT update passwords with this!!
// ⚠️ factory.updateOne() does not use .save() or .create() !!
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

////////////////////////////////////////////////////////
// ME Routes

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /update-password",
        400
      )
    );
  }

  // 🔒 Filter out all but acceptable fields
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename;

  // 📝 It is now safe to use .findByIdAndUpdate because
  // 📝 we have filterd out sensitive data from req.body.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // 2. Update user document
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});
