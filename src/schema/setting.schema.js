const Joi = require("joi");

const updatePrefix = Joi.object({
  name: Joi.string().required(),
});
const updateCurrency = Joi.object({
  default_currency: Joi.boolean().required(),
});

const updateCreateDepartment = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
});

const updateCreateDesignation = Joi.object({
  title: Joi.string().required(),
  department_id: Joi.number().required(),
});

const updateCreateLeave = Joi.object({
  type: Joi.string().required(),
  annual_days: Joi.number().required(),
});

module.exports = {
  updatePrefix,
  updateCurrency,
  updateCreateDepartment,
  updateCreateDesignation,
  updateCreateLeave,
};
