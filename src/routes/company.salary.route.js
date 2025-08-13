const express = require("express");
const {
  salaryDashbaord,
  importSalartCurrentMonth,
  getSalaryHistory,
  generateSalary,
} = require("../controllers/salary.controller");

const router = express.Router();

router.get("/", getSalaryHistory);

router.route("/dashboard").get(salaryDashbaord);

router.post("/import-current-salary", importSalartCurrentMonth);

router.post("/generate-salary", generateSalary);

module.exports = router;
