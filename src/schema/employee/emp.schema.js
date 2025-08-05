const joi = require("joi");
const leaveRequest = joi.object({
  leave_type_id: joi.number().required(),
  start_date: joi.date().required(),
  end_date: joi.date().required(),
  total_days: joi.number().required(),
  leave_on: joi.string().required(),
  reason: joi.string().allow("", null),
  emergency_contact_person: joi.string().allow("", null),
});

const rejectLeaveRequest = joi.object({
  rejected_reason: joi.string().required(),
});

module.exports = {
  leaveRequest,
  rejectLeaveRequest,
};
