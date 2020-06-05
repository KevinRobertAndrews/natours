const mongoose = require("mongoose");
const slugify = require("slugify");

// Validator is not working as intended.
// const validator = require('validator');

/////////////////////////////////////////////////////
// SCHEMA

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have 40 or less characters"],
      minlength: [10, "A tour must have 10 or more characters"],
      // validate: [
      //   validator.isAlpha,
      //   'A tour must have only alpha-numeric characters.',
      // ],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      // 📝 Only use Strings for enums!
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "A tour must have a difficulty of easy, medium, or difficult",
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      // 📝 validate needs to be a full function in order to
      // have access to {this} on the current document.
      validate: {
        validator: function (val) {
          // 🚩📝 {this} will only point to the current document when
          // we are CREATING or SAVING a document. It will not work when
          // UPDATING documents.
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below the regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, "A tour must have a description"],
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // Geospacial data
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinaties: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    // 📝 These options allow for virtual properties
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: "2dshpere" });

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

/////////////////////////////////////////////////////
// MIDDLEWARE

// DOCUMENT MIDDLEWARE ///////
//  📝 Runs before .save() and .create(), but not .update()

tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE ///////

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// AGGREGATION MIDDLEWARE ///////

// tourSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   next();
// });

/////////////////////////////////////////////////////
// EXPORT

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
