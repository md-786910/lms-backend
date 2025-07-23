const Joi = require("joi");
const companyCreate = Joi.object({
  company_name: Joi.string().required(),
  company_size: Joi.number().required(),
  logo: Joi.string().optional(),
    industry_id: Joi.number().required(),
    company_website: Joi.string().uri().optional(),
    country_id: Joi.number().required(),
    subscribe_newsletter: Joi.boolean().optional(),
    terms_accepted: Joi.boolean().optional(),

});
module.exports={
    companyCreate,
}