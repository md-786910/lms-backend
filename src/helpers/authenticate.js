//import { STATUS_CODE } from "../constants/statusCode.js";

const { STATUS_CODE } = require("../constants/statusCode");
const { userRepos, userSessionRepos } = require("../repository/base");
const AppError = require("../utils/appError");
const { verifyToken } = require("./jwt");

// create a middleware to authenticate user and also whitelist routes like
module.exports.authenticateClient = async (req, res, next) => {
  try {
    const { path } = req;
    console.log({ path });
    const whitelist = [
      "/user/create",
      "/user/login",
      "/user/forgot-password",
      "/user/reset-password",
      "/user/verify-email",
      "/resend-verification-email",
      "/logout",
    ];
    if (whitelist.includes(path)) {
      next();
    } else {
      if (!req.header("authorization"))
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
          status: false,
          message: "Token not found",
          data: null,
        });

      const token = req.header("authorization").split("Bearer ");
      req.employee = verifyToken(token[1]).sub;
      const user = await getUser({
        email: req.employee.email,
        username: req.employee.userName,
      });
      if (!user) {
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
          message: "invalid token or user not found",
          status: false,
          data: null,
        });
      }
      if (!user) {
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
          status: false,
          message: "invalid token or user not found",
          data: null,
        });
      }

      req.user = user;
      next();
    }
  } catch (error) {
    return res.status(STATUS_CODE.UNAUTHORIZED).json({
      status: false,
      message: error.message || "Error",
      data: null,
    });
  }
};

module.exports.authenticateAdmin = async (req, res, next) => {
  try {
    const { path } = req;
    console.log({ admin: path });
    const whitelist = [
      "/company/register",
      "/company/search",
      "/country",
      "/user/login",
      "/user/forgot-password",
      "/user/reset-password",
    ];
    if (whitelist.includes(path)) {
      next();
    } else {
      if (!req.header("authorization"))
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
          status: false,
          message: "Token not found",
          data: null,
        });

      const token = req.header("authorization").split("Bearer ");

      // verify token

      const userToken = await userSessionRepos.findOne({
        where: {
          token: token[1],
        },
      });

      req.user = verifyToken(userToken?.token).sub;
      const user = await userRepos.findOne({
        where: {
          email: req.user.email,
          company_id: req.user.company_id,
        },
      });

      if (!user) {
        return next(
          new AppError(
            "invalid token or user not found",
            STATUS_CODE.UNAUTHORIZED
          )
        );
      }

      req.user = user;
      next();
    }
  } catch (error) {
    return next(new AppError("token is invalid", STATUS_CODE.UNAUTHORIZED));
  }
};
