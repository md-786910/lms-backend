const { STATUS_CODE } = require("../constants/statusCode");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  departmentRepos,
  currencyRepos,
  designationRepos,
  leaveRepos,
  documentCategoryRepos,
} = require("../repository/base");

// GET all prefixes for the company
const getPrefix = catchAsync(async (req, res, next) => {
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }

  const prefixes = await departmentRepos.findAll({
    attributes: ["id", "name", "prefix"],
    where: { company_id },
    sort: [["id", "DESC"]],
  });

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Prefixes fetched successfully",
    data: prefixes,
  });
});

// UPDATE a prefix for a department by prefix id (or department_id)
const updatePrefix = catchAsync(async (req, res, next) => {
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const prefixData = req.body;
  for (const prefix_d of prefixData) {
    const { id, prefix } = prefix_d;
    const prefixResp = await departmentRepos.findOne({
      where: {
        id,
        company_id,
      },
    });
    if (!prefixResp) {
      continue;
    }

    prefixResp.prefix = prefix;
    await prefixResp.save();
  }

  res.status(STATUS_CODE.OK).json({
    status: "success",
    message: "Prefix updated successfully",
    data: null,
  });
});

// currency
const getCurrency = catchAsync(async (req, res, next) => {
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const currencies = await currencyRepos.findAll({
    where: { company_id },
    order: [["createdAt", "DESC"]],
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Currencies fetched successfully",
    data: currencies,
  });
});

const updateCurrency = catchAsync(async (req, res, next) => {
  const { id } = req.params; // currencyRepos ID
  if (!id || id === "undefined") {
    return next(new AppError("currency id not found", STATUS_CODE.NOT_FOUND));
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const { default_currency } = req.body;

  // update all curency to false
  await currencyRepos.update(
    {
      default: false,
    },
    {
      where: {
        company_id,
      },
    }
  );

  const currency = await currencyRepos.findOne({
    where: {
      id,
      company_id,
    },
  });
  if (!currency) {
    return res.status(STATUS_CODE.NOT_FOUND).json({
      status: "error",
      message: "Currency not found",
    });
  }

  currency.default = default_currency;
  await currency.save();
  res.status(STATUS_CODE.OK).json({
    status: "success",
    message: "Currency updated successfully",
    data: currency,
  });
});

// department
const getDepartment = catchAsync(async (req, res, next) => {
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const departments = await departmentRepos.findAll({
    where: { company_id },
    order: [["createdAt", "DESC"]],
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Departments fetched successfully",
    data: departments,
  });
});

const createDepartment = catchAsync(async (req, res, next) => {
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const { name, description } = req.body;
  const department = await departmentRepos.create({
    name,
    description,
    company_id,
  });

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Department created successfully",
    data: department,
  });
});

const getDepartmentById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(new AppError("department id not found", STATUS_CODE.NOT_FOUND));
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const department = await departmentRepos.findOne({
    where: { id, company_id },
  });

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Department fetched successfully",
    data: department,
  });
});

const updateDepartment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(new AppError("department id not found", STATUS_CODE.NOT_FOUND));
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const { name, description } = req.body;
  const department = await departmentRepos.findOne({
    where: { id, company_id },
  });
  if (!department) {
    return next(new AppError("department not found", STATUS_CODE.NOT_FOUND));
  }
  department.name = name;
  department.description = description;
  await department.save();
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Department updated successfully",
    data: department,
  });
});

const deleteDepartment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(new AppError("department id not found", STATUS_CODE.NOT_FOUND));
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const department = await departmentRepos.findOne({
    where: { id, company_id },
  });
  if (!department) {
    return next(new AppError("department not found", STATUS_CODE.NOT_FOUND));
  }
  await department.destroy();

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Department deleted successfully",
  });
});

// designation
const getDesignation = catchAsync(async (req, res, next) => {
  const company_id = req.user?.company_id;
  console.log({ company_id });
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const designations = await designationRepos.findAll({
    where: { company_id },
    include: [
      {
        attributes: ["id", "name", "description"],
        model: departmentRepos,
        // where: {
        //   company_id,
        // },
        as: "department",
        required: true,
      },
    ],
    order: [["createdAt", "DESC"]],
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Designations fetched successfully",
    data: designations,
  });
});

const createDesignation = catchAsync(async (req, res, next) => {
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const { title, department_id } = req.body;
  const designation = await designationRepos.create({
    title,
    department_id,
    company_id,
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Designation created successfully",
    data: designation,
  });
});

const getDesignationById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(
      new AppError("designation id not found", STATUS_CODE.NOT_FOUND)
    );
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const designation = await designationRepos.findOne({
    where: { id, company_id },
    include: [
      {
        attributes: ["id", "name", "description"],
        model: departmentRepos,
        as: "department",
      },
    ],
  });

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Designation fetched successfully",
    data: designation,
  });
});

const updateDesignation = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(
      new AppError("designation id not found", STATUS_CODE.NOT_FOUND)
    );
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const { title, department_id } = req.body;
  const designation = await designationRepos.findOne({
    where: { id, company_id },
  });
  if (!designation) {
    return next(new AppError("designation not found", STATUS_CODE.NOT_FOUND));
  }
  designation.title = title;
  designation.department_id = department_id;
  await designation.save();
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Designation updated successfully",
    data: designation,
  });
});

const deleteDesignation = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(
      new AppError("designation id not found", STATUS_CODE.NOT_FOUND)
    );
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const designation = await designationRepos.findOne({
    where: { id, company_id },
  });
  if (!designation) {
    return next(new AppError("designation not found", STATUS_CODE.NOT_FOUND));
  }
  await designation.destroy();
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Designation deleted successfully",
  });
});

// Leave
const getLeave = catchAsync(async (req, res, next) => {
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const leaves = await leaveRepos.findAll({
    where: { company_id },
    order: [["createdAt", "DESC"]],
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Leaves fetched successfully",
    data: leaves,
  });
});

const createLeave = catchAsync(async (req, res, next) => {
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const { type, annual_days } = req.body;
  const leave = await leaveRepos.create({
    type,
    annual_days,
    company_id,
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Leave created successfully",
    data: leave,
  });
});

const getLeaveById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(new AppError("leave id not found", STATUS_CODE.NOT_FOUND));
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const leave = await leaveRepos.findOne({
    where: { id, company_id },
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Leave fetched successfully",
    data: leave,
  });
});

const updateLeave = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(new AppError("leave id not found", STATUS_CODE.NOT_FOUND));
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const { type, annual_days } = req.body;
  const leave = await leaveRepos.findOne({
    where: { id, company_id },
  });
  if (!leave) {
    return next(new AppError("leave not found", STATUS_CODE.NOT_FOUND));
  }
  leave.type = type;
  leave.annual_days = annual_days;
  await leave.save();
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Leave updated successfully",
    data: leave,
  });
});

const deleteLeave = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(new AppError("leave id not found", STATUS_CODE.NOT_FOUND));
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const leave = await leaveRepos.findOne({
    where: { id, company_id },
  });
  if (!leave) {
    return next(new AppError("leave not found", STATUS_CODE.NOT_FOUND));
  }
  await leave.destroy();
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Leave deleted successfully",
  });
});

// document category
const getDocumentCategory = catchAsync(async (req, res, next) => {
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const categories = await documentCategoryRepos.findAll({
    where: { company_id },
    order: [["createdAt", "DESC"]],
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Document categories fetched successfully",
    data: categories,
  });
});

const createDocumentCategory = catchAsync(async (req, res, next) => {
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const { type } = req.body;
  const category = await documentCategoryRepos.create({
    type,
    company_id,
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Document category created successfully",
    data: category,
  });
});

const getDocumentCategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(
      new AppError("document category id not found", STATUS_CODE.NOT_FOUND)
    );
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const category = await documentCategoryRepos.findOne({
    where: { id, company_id },
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Document category fetched successfully",
    data: category,
  });
});

const updateDocumentCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(
      new AppError("document category id not found", STATUS_CODE.NOT_FOUND)
    );
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const { type } = req.body;
  const category = await documentCategoryRepos.findOne({
    where: { id, company_id },
  });
  if (!category) {
    return next(
      new AppError("document category not found", STATUS_CODE.NOT_FOUND)
    );
  }
  category.type = type;
  await category.save();
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Document category updated successfully",
    data: category,
  });
});

const removeDocumentCagegory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id === "undefined") {
    return next(
      new AppError("document category id not found", STATUS_CODE.NOT_FOUND)
    );
  }
  const company_id = req.user?.company_id;
  if (!company_id) {
    return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
  }
  const category = await documentCategoryRepos.findOne({
    where: { id, company_id },
  });
  if (!category) {
    return next(
      new AppError("document category not found", STATUS_CODE.NOT_FOUND)
    );
  }
  await category.destroy();
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Document category deleted successfully",
  });
});

module.exports = {
  getPrefix,
  updatePrefix,
  getCurrency,
  updateCurrency,
  getDepartment,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDesignation,
  createDesignation,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
  getLeave,
  createLeave,
  getLeaveById,
  updateLeave,
  deleteLeave,

  // document category
  getDocumentCategory,
  createDocumentCategory,
  getDocumentCategoryById,
  updateDocumentCategory,
  removeDocumentCagegory,
};
