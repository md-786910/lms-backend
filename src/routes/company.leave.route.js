const express = require("express");
const {
  getAllEmployeLeavs,
  employeLeaveReject,
  employeLeaveApprove,
  getLeaveDashboard,
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

// dashboard

router.get("/dashboard", getLeaveDashboard);

module.exports = router;
