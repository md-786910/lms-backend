const joi = require("joi");
const createEmployee = joi.object({
    first_name: joi.string().required(),
    last_name: joi.string().required(),
    email: joi.string().email().required(),
    phone_number: joi.number().required(),
    alternate_phone_number: joi.number().optional(),
    gender: joi.string().valid("male", "female", "other").required(),
    martial_status: joi.string().valid("single", "married", "divorced", "widowed").required(),
    department_id: joi.number().required(),
    designation_id: joi.number().required(),
    country_id: joi.number().required(),
    date_of_joining: joi.date().required(),
    last_date_of_work: joi.date().optional(),
    is_active: joi.boolean().default(true),
    is_suspended: joi.boolean().default(false),
    is_verified_email: joi.boolean().default(false),
    profile_picture: joi.string().optional(),
    company_id: joi.number().required(),
    employee_id: joi.string().required(),
});

module.exports = {
    createEmployee,
}