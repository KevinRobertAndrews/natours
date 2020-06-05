class AppError extends Error {
  // 📝 AppError extends Error... very cool!
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;

    // 📝 If the status code is a 400 category, then status = 'fail'
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // 📝 Operational vs Programmatic Errors ---
    // AppError.isOperational = true because
    // it will be instantiated in middleware
    // that proves it is an opperational error.
    this.isOperational = true;

    // Add stack trace to the class
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
