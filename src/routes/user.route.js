const express = require("express");
const { STATUS_CODE } = require("../constants/statusCode");
const { joiValidation } = require("../middleware/validation");
const { register } = require("../schema/user");
const router = express.Router();

//@[Register]
router
  .route("/create")
  .get((req, res) => {
    res.status(STATUS_CODE.OK).send("Welcome to the User Registration API");
  })
  .post(joiValidation(register), (req, res) => {
    // Handle user registration logic here
    res.status(STATUS_CODE.CREATED).send("User registered successfully");
  });

module.exports = router;
