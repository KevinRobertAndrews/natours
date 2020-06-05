const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Tour = require("../tours/tourModel");
const Booking = require("../bookings/bookingModel");

// Error handling
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const factory = require("../controllers/handlerFactory");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2. Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: "usd",
        quantity: 1,
      },
    ],
  });

  // 3. Create session as a response
  res.status(200).json({
    status: "success",
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // TODO: This is a temporary implementation because it is not secure!!
  const { tour, user, price } = req.query;
  console.log(tour, user, price);

  if (!tour || !user || !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split("?")[0]);
});

// REST ENDPOINTS
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
