const Joi = require("joi");
const companyCreate = Joi.object({
  company_obj: Joi.object({
    company_name: Joi.string().required(),
    company_size: Joi.number().required(),
    logo: Joi.string().allow("", null),
    industry_id: Joi.number().required(),
    company_website: Joi.string().allow("", null),
    country_id: Joi.number().required(),
    subscribe_newsletter: Joi.boolean().allow("", null),
    terms_accepted: Joi.boolean().allow("", null),
  }).required(),
  user: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone_number: Joi.number().required(),
    phone_country_code: Joi.string().required(),
    job_title: Joi.string().required(),
    password: Joi.string()
      // .pattern(
      //   new RegExp(
      //     "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,128}$"
      //   )
      // )
      .min(5)
      .max(50)
      .required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  }).required(),
  password_without_hash: Joi.string().allow("", null),
});
const companyUpdate = Joi.object({
  logo: Joi.string().allow("", null),
  company_website: Joi.string().allow("", null),
  tax_no: Joi.string().allow("", null),
  address: Joi.string().allow("", null),
  subscribe_newsletter: Joi.boolean().allow("", null),
});
module.exports = {
  companyCreate,
  companyUpdate,
};
