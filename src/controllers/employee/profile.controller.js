const { STATUS_CODE } = require("../../constants/statusCode");
const {
  departmentRepos,
  designationRepos,
  employeeRepos,
  employeeAddressRepos,
  employeeDocumentRepos,
  documentCategoryRepos,
  fileRepos,
  EmployeePersonalInformationRepos,
  employeeSalaryRepos,
} = require("../../repository/base");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

// get employe profile
const getProfile = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("user not found", STATUS_CODE.NOT_FOUND));
  }
  const { id, company_id } = req.user;
  const employee = await employeeRepos.findOne({
    attributes: [
      "id",
      "first_name",
      "last_name",
      "email",
      "phone_number",
      "date_of_birth",
      "date_of_joining",
      "profile",
      "martial_status",
      "gender",
      "employee_no",
    ],
    where: { id, company_id },
    include: [
      {
        attributes: ["id", "name"],
        model: departmentRepos,
        as: "department",
      },
      {
        attributes: ["id", "title"],
        model: designationRepos,
        as: "designation",
      },
    ],
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Employee profile fetched successfully",
    data: employee,
  });
});

// get employee address
const getAddress = catchAsync(async (req, res, next) => {
  const { id, company_id } = req.user;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const address = await employeeAddressRepos.findOne({
    where: {
      employee_id: id,
      company_id,
    },
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Employee address fetched successfully",
    data: address,
  });
});

// get document
const getDocument = catchAsync(async (req, res, next) => {
  const { id, company_id } = req.user;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const document = await employeeDocumentRepos.findAll({
    where: {
      company_id,
      employee_id: id,
    },
    include: [
      {
        model: documentCategoryRepos,
        as: "document_category",
      },
      {
        model: fileRepos,
        as: "file",
      },
    ],
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Employee document fetched successfully",
    data: document,
  });
});

// get personal info
const getPersonalInfo = catchAsync(async (req, res, next) => {
  const { id, company_id } = req.user;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const personalInfo = await EmployeePersonalInformationRepos.findOne({
    where: {
      company_id,
      employee_id: id,
    },
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Employee personal info fetched successfully",
    data: personalInfo,
  });
});

// get salary
const getSalary = catchAsync(async (req, res, next) => {
  const { id, company_id } = req.user;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const salary = await employeeSalaryRepos.findOne({
    where: {
      company_id,
      employee_id: id,
    },
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Employee salary fetched successfully",
    data: salary,
  });
});

// upload profile pic
const uploadProfile = catchAsync(async (req, res, next) => {
  const { id, company_id } = req.user;
  if (!id || !company_id) {
    return next(new AppError("User not found", STATUS_CODE.NOT_FOUND));
  }

  const employee = await employeeRepos.findOne({
    where: { id, company_id },
  });

  if (!employee) {
    return next(new AppError("Employee not found", STATUS_CODE.NOT_FOUND));
  }

  employee.profile = req.body?.profile;
  await employee.save();

  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Profile picture updated successfully",
    data: employee,
  });
});

module.exports = {
  getProfile,
  getAddress,
  getDocument,
  getPersonalInfo,
  getSalary,
  uploadProfile,
};
