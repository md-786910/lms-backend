//import { STATUS_CODE } from "../constants/statusCode.js";


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
          message: MESSAGES.PASS_TOKEN_INVD_ERR,
          data: null,
        });

      const token = req.header("authorization").split("Bearer ");
      req.user = verifyToken(token[1]).sub;
      const user = await getUser({
        email: req.user.email,
        username: req.user.userName,
      });
      if (!user) {
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
          message: MESSAGES.PASS_TOKEN_INVD_ERR,
          status: false,
          data: null,
        });
      }
      if (!user) {
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
          status: false,
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
