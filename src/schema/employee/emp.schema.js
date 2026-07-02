const joi = require("joi");
const leaveRequest = joi.object({
  request_type: joi.string().valid("policy", "floating", "extra_work").default("policy"),
  leave_type_id: joi.when("request_type", {
    is: joi.valid("floating", "extra_work"),
    then: joi.number().allow(null).optional(),
    otherwise: joi.number().required(),
  }),
  festival_name: joi.string().allow("", null),
  festival_date: joi.date().allow(null),
  justification: joi.string().allow("", null),
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
