const { TABLE_MODEL_MAPPING, TABLE_NAME } = require("../constants/table");
const db = require("../models");

const userRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.USER]];

const companyRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.COMPANY]];
const employeeRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE]];
const EmployeePersonalInformationRepos =
  db[TABLE_MODEL_MAPPING[TABLE_NAME.EMPLOYEE_PERSONAL_INFORMATION]];

const userSessionRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.USER_SESSION]];

const countryRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.COUNTRY]];

const industryRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.INDUSTY]];

const prefixRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.PREFIX]];
const leaveRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.LEAVE]];
const departmentRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.DEPARTMENT]];
const designationRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.DESIGNATION]];
const currencyRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.CURRENCY]];
const templateRepos = db[TABLE_MODEL_MAPPING[TABLE_NAME.TEMPLATE]];

module.exports = {
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
};
