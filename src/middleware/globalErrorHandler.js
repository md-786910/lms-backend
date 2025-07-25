// const { JsonWebTokenError, TokenExpiredError } = require("jsonwebtoken");
// const { STATUS_CODE } = require("../constants/statusCode");
// const { ValidationError, DatabaseError, UniqueConstraintError, ForeignKeyConstraintError, ConnectionError } = require("sequelize");

// const isDev = process.env.NODE_ENV !== "production";

// module.exports.globalErrorHandler = (err, req, res, next) => {
//   let statusCode = err.statusCode || 500;
//   let message = err.message || "Internal Server Error";

//   // 🟡 Handle Joi Validation Errors
//   if (err.isJoi) {
//     statusCode = STATUS_CODE.BAD_REQUEST;
//     message =
//       err.details?.map((d) => d.message).join(", ") || "Validation failed";
//   }

//   // 🔴 Handle JWT Errors
//   if (err instanceof JsonWebTokenError) {
//     statusCode = STATUS_CODE.UNAUTHORIZED;
//     message = "Invalid token";
//   }

//   if (err instanceof TokenExpiredError) {
//     statusCode = STATUS_CODE.UNAUTHORIZED;
//     message = "Token expired";
//   }

//   // 🔵 Handle custom errors
//   if (err.name === "UnauthorizedError") {
//     statusCode = STATUS_CODE.UNAUTHORIZED;
//     message = "Unauthorized";
//   }

//   // 🟣 Handle Sequelize Errors
//   if (err instanceof ValidationError) {
//     statusCode = STATUS_CODE.BAD_REQUEST;
//     message = err.errors.map((e) => e.message).join(", ") || "Sequelize validation failed";
//   }

//   if (err instanceof DatabaseError) {
//     statusCode = STATUS_CODE.INTERNAL_SERVER_ERROR;
//     message = "Sequelize database error";
//   }

//   if (err instanceof UniqueConstraintError) {
//     statusCode = STATUS_CODE.BAD_REQUEST;
//     message = "Unique constraint violation";
//   }

//   if (err instanceof ForeignKeyConstraintError) {
//     statusCode = STATUS_CODE.BAD_REQUEST;
//     message = "Foreign key constraint violation";
//   }

//   if (err instanceof ConnectionError) {
//     statusCode = STATUS_CODE.INTERNAL_SERVER_ERROR;
//     message = "Sequelize connection error";
//   }

//   // Handle other types of errors if needed

//   const errorResponse = {
//     status: "error",
//     statusCode,
//     message,
//     ...(isDev && { stack: err.stack }),
//   };

//   res.status(statusCode).json(errorResponse);
// };

const { JsonWebTokenError, TokenExpiredError } = require("jsonwebtoken");
const {
  ValidationError,
  DatabaseError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  ConnectionError,
} = require("sequelize");
const { STATUS_CODE } = require("../constants/statusCode");

const isDev = process.env.NODE_ENV !== "production";

module.exports.globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Helper for formatting Joi errors
  const formatJoiMessage = (error) => {
    const field = error.path.join(".");
    switch (error.type) {
      case "any.required":
        return `${field} is required.`;
      case "string.empty":
      case "number.empty":
        return `${field} cannot be empty.`;
      case "string.base":
        return `${field} must be a string.`;
      case "number.base":
        return `${field} must be a number.`;
      case "any.only":
        return `${field} must be one of the allowed values.`;
      case "string.pattern.base":
        return `${field} format is invalid.`;
      default:
        return error.message;
    }
  };

  // 🟡 Joi validation errors
  if (err.isJoi) {
    statusCode = STATUS_CODE.BAD_REQUEST;

    const formattedErrors = err.details.map((detail) => ({
      path: detail.path.join("."),
      message: formatJoiMessage(detail),
    }));

    message = formattedErrors[0]?.message || "Validation failed";

    return res.status(statusCode).json({
      status: "error",
      statusCode,
      message,
      errors: formattedErrors,
      ...(isDev && { stack: err.stack }),
    });
  }

  // 🔴 JWT errors
  if (err instanceof JsonWebTokenError) {
    statusCode = STATUS_CODE.UNAUTHORIZED;
    message = "Invalid token";
  }

  if (err instanceof TokenExpiredError) {
    statusCode = STATUS_CODE.UNAUTHORIZED;
    message = "Token expired";
  }

  // 🔵 Custom Unauthorized
  if (err.name === "UnauthorizedError") {
    statusCode = STATUS_CODE.UNAUTHORIZED;
    message = "Unauthorized";
  }

  // 🟣 Sequelize errors
  if (err instanceof ValidationError) {
    statusCode = STATUS_CODE.BAD_REQUEST;
    message =
      err.errors.map((e) => e.message).join(", ") || "Validation failed";
  }

  if (err instanceof UniqueConstraintError) {
    statusCode = STATUS_CODE.BAD_REQUEST;
    message = "Unique constraint violation";
  }

  if (err instanceof ForeignKeyConstraintError) {
    statusCode = STATUS_CODE.BAD_REQUEST;
    message = "Foreign key constraint violation";
  }

  if (err instanceof DatabaseError) {
    statusCode = STATUS_CODE.INTERNAL_SERVER_ERROR;
    message = "Database error";
  }

  if (err instanceof ConnectionError) {
    statusCode = STATUS_CODE.INTERNAL_SERVER_ERROR;
    message = "Database connection error";
  }

  // Final default error response
  const errorResponse = {
    status: "error",
    statusCode,
    message,
    ...(isDev && { stack: err.stack }),
  };

  return res.status(statusCode).json(errorResponse);
};
