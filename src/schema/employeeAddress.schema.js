const joi = require("joi");
const createEmployeeAddress = joi.object({
    street: joi.string().required(),
    city: joi.string().required(),
    state: joi.string().required(),
    zip_code: joi.string().required(),
    permanent_address: joi.boolean().default(false),
    country_id: joi.number().required(),
    employee_id: joi.number().required(),
    company_id: joi.number().required(),  
});
module.exports = {
    createEmployeeAddress,
}