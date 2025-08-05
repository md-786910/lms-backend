const express = require("express");
const { STATUS_CODE } = require("../constants/statusCode");
const { joiValidation } = require("../middleware/validation");
const {
  login,
  forgotPassword,
  createNewPassword,
  verifyEmployee,
} = require("../schema/user");
const {
  loginUser,
  forgotPasswordUser,
  resetPasswordUser,
  verifyEmployeeCreatePassword,
} = require("../controllers/user.controller");
const router = express.Router();

//@[login]
router.route("/login").post(joiValidation(login), loginUser);

router
  .route("/forgot-password")
  .post(joiValidation(forgotPassword), forgotPasswordUser);

router.post(
  "/reset-password",
  joiValidation(createNewPassword),
  resetPasswordUser
);

// verify email and create new password
router.post(
  "/verify-email",
  joiValidation(verifyEmployee),
  verifyEmployeeCreatePassword
);

module.exports = router;
