const Joi = require("joi");

const updatePrefix = Joi.array().items(
  Joi.object({
    prefix: Joi.string().required(),
    id: Joi.number().required(),
  })
);
const updateCurrency = Joi.object({
  default_currency: Joi.boolean().required(),
});

const updateCreateDepartment = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow("", null),
});

const updateCreateDesignation = Joi.object({
  title: Joi.string().required(),
  department_id: Joi.number().required(),
});

const updateCreateLeave = Joi.object({
  type: Joi.string().required(),
  annual_days: Joi.number().required(),
});

const updateDocumentCategory = Joi.object({
  type: Joi.string().required(),
});

module.exports = {
  updatePrefix,
  updateCurrency,
  updateCreateDepartment,
  updateCreateDesignation,
  updateCreateLeave,
  updateDocumentCategory,
};
