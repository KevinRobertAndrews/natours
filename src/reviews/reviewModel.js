const mongoose = require("mongoose");

const Tour = require("../tours/tourModel");

//////////////////////////////////////////////////
// SCHEMA

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "A review must have a body of text."],
      minlength: [30, "A review must have a body of at least 30 characters"],
    },
    rating: {
      type: Number,
      default: 4.5,
      required: [true, "A review must have a rating."],
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "A review must belong to a tour."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A review must belong to a user."],
    },
  },
  {
    // 📝 These options allow for virtual properties
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// QUERY MIDDLEWARE ///////
reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name email',
  //   });

  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});

///////////////////////////////////////////
// STATIC METHODS

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // 📝 In a static method, .this refers to the MODEL
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        numRatings: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// 📝 The best time to do this is post save. Because the data
// needs to exist for the function to make sense.
reviewSchema.post("save", function () {
  // 📝 In a .pre() method, .this refers to the current DOCUMENT.
  // this.constructor refers to the current MODEL
  this.constructor.calcAverageRatings(this.tour);
});

// In a Query middle ware, you only have access to the query. But
// actually we need to access the document. Nice trick!
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // We create an "r" property on this, so that we can pass it to
  // the post middlewhere where we can execute the calucation.
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // REVIEW THIS.
  // await this.findOne(); does NOT work here because query has
  // already been excecuted
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
