// handle try catch for async functions
module.exports = function catchAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch((error) => {
      // Log the error if a logger is available
      if (typeof console !== "undefined" && console.error) {
        console.error(error);
      }
      // Pass the error to the next middleware
      next(error);
    });
  };
}
