const { JsonWebTokenError, TokenExpiredError } = require("jsonwebtoken");
const { STATUS_CODE } = require("../constants/statusCode");
const { ValidationError, DatabaseError, UniqueConstraintError, ForeignKeyConstraintError, ConnectionError } = require("sequelize");

const isDev = process.env.NODE_ENV !== "production";

module.exports.globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // 🟡 Handle Joi Validation Errors
  if (err.isJoi) {
    statusCode = STATUS_CODE.BAD_REQUEST;
    message =
      err.details?.map((d) => d.message).join(", ") || "Validation failed";
  }

  // 🔴 Handle JWT Errors
  if (err instanceof JsonWebTokenError) {
    statusCode = STATUS_CODE.UNAUTHORIZED;
    message = "Invalid token";
  }

  if (err instanceof TokenExpiredError) {
    statusCode = STATUS_CODE.UNAUTHORIZED;
    message = "Token expired";
  }

  // 🔵 Handle custom errors
  if (err.name === "UnauthorizedError") {
    statusCode = STATUS_CODE.UNAUTHORIZED;
    message = "Unauthorized";
  }

  // 🟣 Handle Sequelize Errors
  if (err instanceof ValidationError) {
    statusCode = STATUS_CODE.BAD_REQUEST;
    message = err.errors.map((e) => e.message).join(", ") || "Sequelize validation failed";
  }

  if (err instanceof DatabaseError) {
    statusCode = STATUS_CODE.INTERNAL_SERVER_ERROR;
    message = "Sequelize database error";
  }

  if (err instanceof UniqueConstraintError) {
    statusCode = STATUS_CODE.BAD_REQUEST;
    message = "Unique constraint violation";
  }

  if (err instanceof ForeignKeyConstraintError) {
    statusCode = STATUS_CODE.BAD_REQUEST;
    message = "Foreign key constraint violation";
  }

  if (err instanceof ConnectionError) {
    statusCode = STATUS_CODE.INTERNAL_SERVER_ERROR;
    message = "Sequelize connection error";
  }

  // Handle other types of errors if needed

  const errorResponse = {
    status: "error",
    statusCode,
    message,
    ...(isDev && { stack: err.stack }),
  };

  res.status(statusCode).json(errorResponse);
};
