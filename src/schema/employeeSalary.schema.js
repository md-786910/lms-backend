const joi = require("joi");
const createEmployeeSalary = joi.object({
    base_salary: joi.number().required(),
    bonus: joi.number().optional(),
    cca: joi.number().optional(),
    hra: joi.number().optional(),
    is_epf_applicable: joi.boolean().default(false),
    epf: joi.number().optional(),
    epf_pension: joi.number().optional(),
    epf_admin: joi.number().optional(),
    total_allowance: joi.number().optional(),
    salary_with_allowance: joi.number().optional(),
    total_deduction_allowance: joi.number().optional(),
    payable_salary: joi.number().required(),
    bank_account_number: joi.string().required(),
    ifsc_code: joi.string().required(),
    bank_name: joi.string().required(),
    employee_id: joi.number().required(),
    company_id: joi.number().required(),
});

module.exports = {
    createEmployeeSalary,
}