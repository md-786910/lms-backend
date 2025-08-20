const express = require("express");
const {
  getSalary,
  getSalaryHistory,
} = require("../../controllers/employee/salary.controller");
const salaryRouter = express.Router();

// employee salary
salaryRouter.get("/", getSalary);
salaryRouter.get("/history", getSalaryHistory);

module.exports = salaryRouter;
