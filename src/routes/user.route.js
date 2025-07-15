const express = require("express");
const { joiValidation } = require("../middleware/validation");
const { register } = require("../schema/user");
const router = express.Router();

//@[Register]
router
  .route("/create")
  .get((req, res) => {
    res.status(200).send("Welcome to the User Registration API");
  })
  .post(joiValidation(register), (req, res) => {
    // Handle user registration logic here
    res.status(201).send("User registered successfully");
  });

module.exports = router;
