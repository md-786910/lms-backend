const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");
const db = require("../models");

const userRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.USER]];

const companyRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.COMPANY]];
const employeeRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE]];
const EmployeePersonalInformationRepos =
  db[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_PERSONAL_INFORMATION]];
const employeeAddressRepos =
  db[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_ADDRESS]];

const userSessionRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.USER_SESSION]];
const industryRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.INDUSTY]];

const countryRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.COUNTRY]];

const employeeSalaryRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_SALARY]];

// settings
const prefixRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.PREFIX]];
const leaveRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.LEAVE]];
const departmentRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.DEPARTMENT]];
const designationRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.DESIGNATION]];
const currencyRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.CURRENCY]];
const templateRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.TEMPLATE]];
const documentCategoryRepos =
  db[TABLE_MODEL_MAPPING[TABLE_NAME.DOCUMENT_CATEGORY]];

const employeeDocumentRepos =
  db[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_DOCUMENT]];

const fileRepos = db["file"];

const employeLeaveRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_LEAVE]];

const leaveRequestRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.LEAVE_REQUEST]];

const activityRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.ACTIVITY]];

const notificationRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.NOTIFICATION]];

module.exports = {
  notificationRepos,
  activityRepos,
  employeLeaveRepos,
  leaveRequestRepos,
  documentCategoryRepos,
  userRepos,
  companyRepos,
  employeeRepos,
  EmployeePersonalInformationRepos,
  userSessionRepos,
  industryRepos,
  countryRepos,
  prefixRepos,
  leaveRepos,
  departmentRepos,
  designationRepos,
  currencyRepos,
  templateRepos,
  employeeAddressRepos,
  employeeDocumentRepos,
  fileRepos,
  employeeSalaryRepos,
};
