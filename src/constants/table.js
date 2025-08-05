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
  EMPLOYEE_LEAVE: "employee_leaves",
  LEAVE_REQUEST: "leave_requests",
  ACTIVITY: "activities",

  // Admin
  DEPARTMENT: "departments",
  DESIGNATION: "designations",
  COUNTRY: "countries",
  INDUSTY: "industries",
  DOCUMENT_CATEGORY: "document_categories",

  PREFIX: "prefixes",
  LEAVE: "leaves",
  CURRENCY: "currencies",
  TEMPLATE: "templates",

  NOTIFICATION: "notifications",
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
  [TABLE_NAME.EMPLOYEE_LEAVE]: "EmployeeLeave",
  [TABLE_NAME.LEAVE_REQUEST]: "LeaveRequest",
  [TABLE_NAME.ACTIVITY]: "Activity",

  // Admin
  [TABLE_NAME.DEPARTMENT]: "Department",
  [TABLE_NAME.DESIGNATION]: "Designation",
  [TABLE_NAME.COUNTRY]: "Country",
  [TABLE_NAME.INDUSTY]: "Industry",
  [TABLE_NAME.DOCUMENT_CATEGORY]: "DocumentCategory",

  [TABLE_NAME.PREFIX]: "Prefix",
  [TABLE_NAME.LEAVE]: "Leave",
  [TABLE_NAME.CURRENCY]: "Currency",
  [TABLE_NAME.TEMPLATE]: "Template",

  [TABLE_NAME.NOTIFICATION]: "Notification",
};

module.exports = {
  TABLE_NAME,
  TABLE_MODEL_MAPPING,
};
