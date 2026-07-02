const joi = require("joi");

const workTypes = ["remote", "overtime", "special_assignment", "task_completion"];
const workingHours = ["half_day", "full_day"];

const createProofOfWork = joi.object({
  title: joi.string().trim().min(2).max(255).required(),
  work_type: joi.string().valid(...workTypes).required(),
  working_hours: joi.string().valid(...workingHours).required(),
  work_date: joi.date().required(),
  description: joi.string().trim().min(3).required(),
  file_ids: joi.array().items(joi.number().integer().positive()).min(1).required(),
});

const approveProofOfWork = joi.object({
  manager_comment: joi.string().allow("", null),
});

const rejectProofOfWork = joi.object({
  manager_comment: joi.string().trim().min(3).required(),
});

module.exports = {
  createProofOfWork,
  approveProofOfWork,
  rejectProofOfWork,
  workTypes,
  workingHours,
};
