const express = require("express");
const {
  dashboard,
} = require("../../controllers/employee/dashboard.controller");
const employeeDashboardRouter = express.Router();

employeeDashboardRouter.route("/").get(dashboard);

module.exports = employeeDashboardRouter;
