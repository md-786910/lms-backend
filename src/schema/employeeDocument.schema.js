const joi = require("joi");
const createEmployeeDocument = joi.object({
    employee_id: joi.number().required(),
    company_id: joi.number().required(),
    document_category_id: joi.number().optional(),
    document_number: joi.string().optional(),
    file_path: joi.string().optional(),
    street: joi.string().optional(),
});

module.exports = {
    createEmployeeDocument,
}