const express = require("express");
const {
  getAllLeave,
  getAllLeaveRequest,
  createLeaveRequest,
  cancelLeaveRequest,
} = require("../../controllers/employee/leave.controller");
const { leaveRequest } = require("../../schema/employee/emp.schema");
const { joiValidation } = require("../../middleware/validation");
const leaveRouter = express.Router();

// Employee routes
leaveRouter.route("/").get(getAllLeave);

leaveRouter
  .route("/leave-request")
  .get(getAllLeaveRequest)
  .post(joiValidation(leaveRequest), createLeaveRequest);

leaveRouter.delete(
  "/cancel-leave-request/:leave_request_id",
  cancelLeaveRequest
);

module.exports = leaveRouter;
