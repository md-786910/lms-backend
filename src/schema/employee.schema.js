const joi = require("joi");
const addEmployee = joi.object({
  employee_no: joi.number().integer(),
  first_name: joi.string().required(),
  last_name: joi.string().allow("", null),
  email: joi.string().email().required(),
  phone_number: joi.number().required(),
  gender: joi.string().valid("male", "female", "other").required(),
  martial_status: joi
    .string()
    .valid("single", "married", "divorced", "widowed")
    .required(),
  department_id: joi.number().required(),
  designation_id: joi.number().required(),
  date_of_joining: joi.date().required(),
  date_of_birth: joi.date().required(),
  employee_id: joi.string().allow("", null),
});

const updateBasicInfo = joi.object({
  first_name: joi.string().required(),
  last_name: joi.string().allow("", null),
  email: joi.string().email().required(),
  phone_number: joi.number().required(),
  gender: joi.string().valid("male", "female", "other").allow("", null),
  martial_status: joi
    .string()
    .valid("single", "married", "divorced", "widowed")
    .required(),
  date_of_joining: joi.date().required(),
  date_of_birth: joi.date().required(),
  department_id: joi.number().required(),
  designation_id: joi.number().required(),
  nationality: joi.string().allow("", null),
});

const updateProfilePics = joi.object({
  profile: joi.string().allow("", null),
});

const updateAddress = joi.object({
  street: joi.string().required(),
  city: joi.string().required(),
  state: joi.string().required(),
  zip_code: joi.string().required(),
  permanent_address: joi.string().allow("", null), // Text field, treated as string in joi
});

const updatePersonalInfo = joi.object({
  emergency_contact_person: joi.string().allow("", null),
  emergency_contact_number: joi.string().allow("", null),
  emergency_contact_relationship: joi.string().allow("", null),
  blood_group: joi.string().required(),
  medical_conditions: joi.string().allow("", null),
  hobbies: joi.string().allow("", null),
  epf_no: joi.string().allow("", null),
  esic_no: joi.string().allow("", null),
  pan_no: joi.string().allow("", null),
  aadhaar_no: joi.string().allow("", null),
  passport_no: joi.string().allow("", null),
  uan_no: joi.string().allow("", null),
});

// Define the schema for each document in the array
const uploadDocumentsSchema = joi.object({
  document_category_id: joi.number().required(),
  document_number: joi.string().allow("", null),
  file_id: joi.number().required(),
});

// Define the schema for an array of documents
const uploadNewDocument = joi.array().items(uploadDocumentsSchema);

// salary
const updateSalary = joi.object({
  is_epf_applicable: joi.boolean().default(false),
  epf: joi.string().allow("", null),
  epf_pension: joi.number().integer(),
  epf_admin: joi.number().integer(),

  bank_account_number: joi.string().allow("", null),
  ifsc_code: joi.string().allow("", null),
  bank_name: joi.string().allow("", null),
  upi_number: joi.string().allow("", null),

  base_salary: joi.number().required(),
  bonus: joi.number().integer(),
  cca: joi.number().integer(),
  hra: joi.number().integer(),
  total_allowance: joi.number().integer(),
  salary_with_allowance: joi.number().integer(),
  total_deduction_allowance: joi.number().integer(),
  payable_salary: joi.number().integer(),
});

// leave
const updateEmployeeLeave = joi.array().items(
  joi.object({
    id: joi.number().required(),
    leave_balance_to_add: joi.number().required(),
    leave_balance_to_subtract: joi.number().required(),
  })
);

module.exports = {
  addEmployee,
  updateBasicInfo,
  updateProfilePics,
  updateAddress,
  updatePersonalInfo,
  uploadNewDocument,
  updateSalary,
  updateEmployeeLeave,
};
