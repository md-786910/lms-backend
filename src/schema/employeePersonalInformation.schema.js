const joi = require("joi");
const createEmployeeInfo = joi.object({
    emergency_contact_name: joi.string().required(),
    emergency_contact_number: joi.number().required(),
    emergency_contact_relationship: joi.string().optional(),
    employee_id: joi.number().required(),
    company_id: joi.number().required(),
    blood_group: joi.string().optional(),
    medical_conditions: joi.string().optional(),
    hobbies: joi.string().optional(),
    epf_no: joi.string().optional(),
    esic_no: joi.string().optional(),
    pan_no: joi.string().required(),
    aadhaar_no: joi.number().optional(),
    passport_no: joi.string().optional(),
    uan_no: joi.string().optional(),
});
module.exports = {
    createEmployeeInfo,
}