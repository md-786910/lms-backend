const TABLE_NAME = {
  USER: "users",
  COMPANY: "companies",
  USER_SESSION: "user_sessions",

  // Employee
  EMPLOYEE: "employees",
  EMPLOYEE_ADDRESS: "employee_addresses",
  EMPLOYEE_PERSONAL_INFORMATION: "employee_personal_informations",
  EMPLOYEE_SALARY: "employee_salaries",
  EMPLOYEE_DOCUMENT: "employee_documents",

  // Admin
  DEPARTMENT: "departments",
  DESIGNATION: "designations",
  COUNTRY: "countries",
  DOCUMENT_CATEGORY: "document_categories",
};

const TABLE_MODEL_MAPPING = {
  [TABLE_NAME.USER]: "User",
  [TABLE_NAME.COMPANY]: "Company",
  [TABLE_NAME.USER_SESSION]: "UserSession",

  // Employee
  [TABLE_NAME.EMPLOYEE]: "Employee",
  [TABLE_NAME.EMPLOYEE_DOCUMENT]: "EmployeeDocument",
  [TABLE_NAME.EMPLOYEE_ADDRESS]: "EployeeAddress",
  [TABLE_NAME.EMPLOYEE_PERSONAL_INFORMATION]: "EmployeePersonalInformation",
  [TABLE_NAME.EMPLOYEE_SALARY]: "EmployeeSalary",

  // Admin
  [TABLE_NAME.DEPARTMENT]: "Department",
  [TABLE_NAME.DESIGNATION]: "Designation",
  [TABLE_NAME.COUNTRY]: "Country",
  [TABLE_NAME.DOCUMENT_CATEGORY]: "DocumentCategory",
};

module.exports = {
  TABLE_NAME,
  TABLE_MODEL_MAPPING,
};
