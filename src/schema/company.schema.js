const Joi = require("joi");
const companyCreate = Joi.object({
  company_obj: Joi.object({
    company_name: Joi.string().required(),
    company_size: Joi.number().required(),
    logo: Joi.string().optional(),
    industry_id: Joi.number().required(),
    company_website: Joi.string().optional(),
    country_id: Joi.number().required(),
    subscribe_newsletter: Joi.boolean().optional(),
    terms_accepted: Joi.boolean().optional(),
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
});
const companyUpdate = Joi.object({
  company_name: Joi.string().required(),
  logo: Joi.string().optional(),
  company_website: Joi.string().uri().optional(),
  tax_no: Joi.string().optional(),
  address: Joi.string().optional(),
  subscribe_newsletter: Joi.boolean().optional(),
});
module.exports = {
  companyCreate,
  companyUpdate,
};
