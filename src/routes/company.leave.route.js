const express = require("express");
const {
  getAllEmployeLeavs,
  employeLeaveReject,
  employeLeaveApprove,
  getLeaveDashboard,
  adminCreateLeaveRequest,
  getYearlyLeaveSummary,
} = require("../controllers/leave.controller");
const { joiValidation } = require("../middleware/validation");
const { rejectLeaveRequest } = require("../schema/employee/emp.schema");
const router = express.Router();

router.route("/").get(getAllEmployeLeavs);
router.post(
  "/reject/:id/employee/:employee_id",
  joiValidation(rejectLeaveRequest),
  employeLeaveReject
);
router.post("/approve/:id/employee/:employee_id", employeLeaveApprove);

// Admin create leave
router.post("/create-leave", adminCreateLeaveRequest);

// dashboard
router.get("/dashboard", getLeaveDashboard);

// Yearly leave summary
router.get("/yearly-summary", getYearlyLeaveSummary);

module.exports = router;
