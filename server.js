const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_TEST_SECRET);

// 📝 dotenv loads environment variables from a .env file into process.env.
const dotenv = require("dotenv");

// Global uncaught exception handler
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message, err);
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  process.exit(1);
});

// 📝 dotenv.config() comes AFTER process.on!
dotenv.config({ path: "./config/config.env" });

// 📝 app needs to be required AFTER dotenv.config()
const app = require("./app");

// Database keys
const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.MONGO_PASSWORD
);

// Setup mongoose options
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful"));

// STRIPE
const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400;
};
app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd",
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

// Fire up server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`App listening on port: ${PORT}`);
});

// Global unhandled promise rejection handler
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM RECIEVED. Shutting down gracefully.");
  server.close(() => {
    console.log("Process terminated!");
  });
});
