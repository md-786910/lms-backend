const express = require("express");
const { salaryDashbaord } = require("../controllers/salary.controller");

const router = express.Router();

router.route("/dashboard").get(salaryDashbaord);

module.exports = router;
