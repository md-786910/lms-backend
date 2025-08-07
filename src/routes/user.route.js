const express = require("express");
const { STATUS_CODE } = require("../constants/statusCode");
const { joiValidation } = require("../middleware/validation");
const {
  login,
  forgotPassword,
  createNewPassword,
  verifyEmployee,
  createNewUser,
} = require("../schema/user");
const {
  loginUser,
  forgotPasswordUser,
  resetPasswordUser,
  verifyEmployeeCreatePassword,
  addNewUser,
  getAllUser,
  deleteNewUser,
} = require("../controllers/user.controller");
const { ROLE } = require("../constants/user");
const { userSessionRepos } = require("../repository/base");
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

// add new user as admin
router.post("/add-new-user", joiValidation(createNewUser), addNewUser);
router.get("/new-user", getAllUser);

router.delete("/new-user/:id", deleteNewUser);

// user logout

router.post("/logout", async (req, res) => {
  const token = req.header("authorization").split("Bearer ")[1];
  const session = await userSessionRepos.findOne({
    where: {
      token,
    },
  });
  if (session) {
    await userSessionRepos.destroy({
      where: {
        token: session.token,
      },
    });
  }

  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Logout successfully",
  });
});

module.exports = router;
