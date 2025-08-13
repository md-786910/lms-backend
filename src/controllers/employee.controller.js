const { STATUS_CODE } = require("../constants/statusCode");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {
  employeeRepos,
  departmentRepos,
  designationRepos,
  employeeAddressRepos,
  countryRepos,
  employeeDocumentRepos,
  companyRepos,
  documentCategoryRepos,
  fileRepos,
  EmployeePersonalInformationRepos,
  employeeSalaryRepos,
  employeLeaveRepos,
  activityRepos,
  prefixRepos,
} = require("../repository/base");
const { generateToken } = require("../helpers/jwt");
const eventEmitter = require("../events/eventEmitter");
const eventObj = require("../events/events");
const initEmployeeLeave = require("../repository/initEmployeeLeave");

const createEmployee = catchAsync(async (req, res, next) => {
  const { company_id, country_id = 91 } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const employee = req.body;
  const existingEmployee = await employeeRepos.findOne({
    where: {
      email: employee.email,
    },
    raw: true,
  });

  // employ is already exist
  if (existingEmployee) {
    return next(
      new AppError(
        "Employee with this email already exists with this company",
        STATUS_CODE.BAD_REQUEST
      )
    );
  }

  // check employee already exist

  const department = await departmentRepos.findByPk(employee.department_id, {
    attributes: ["prefix"],
    where: {
      company_id,
    },
  });
  const newEmployee = await employeeRepos.create({
    ...employee,
    country_id,
    company_id,
  });

  const employee_no = `${department?.prefix ?? "EMP"}-${newEmployee?.id}`;
  newEmployee.employee_no = employee_no;
  await newEmployee.save();

  //@crate token to employe to verifed itself and crate own password
  const token = await generateToken({
    id: newEmployee.id,
    email: newEmployee.email,
    company_id,
    role: "employee",
  });

  // @fire event to employe email
  eventEmitter.emit(eventObj.ADD_NEW_EMPLOYEE, {
    employee: JSON.parse(JSON.stringify(newEmployee)),
    token,
  });

  // activitu
  await activityRepos.addActivity({
    company_id,
    employee_id: newEmployee.id,
    title: `New employee ${newEmployee.first_name} added`,
    message: "Employee created successfully",
  });

  // add leave to per employee
  console.log("Start init leave for employee default");
  await initEmployeeLeave({
    company_id,
    employee_id: newEmployee.id,
  });

  res.status(STATUS_CODE.CREATED).json({
    success: true,
    message: "Employee created successfully",
    data: newEmployee,
  });
});

const getAllEmployees = catchAsync(async (req, res, next) => {
  const { is_suspended = false } = req.query;

  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  let employees = await employeeRepos.findAll({
    where: { company_id, is_suspended },
    include: [
      {
        model: departmentRepos,
        as: "department",
      },
      {
        model: designationRepos,
        as: "designation",
      },
      {
        attributes: [
          "id",
          "leave_id",
          "leave_count",
          "leave_type",
          "leave_used",
          "leave_remaing",
        ],
        model: employeLeaveRepos,
        as: "employee_leaves",
      },
      {
        model: employeeAddressRepos,
        as: "address",
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  for (const key in employees) {
    const department_id = employees[key].department_id;
    let prefix = await prefixRepos.findOne({
      attributes: ["name"],
      where: {
        company_id,
        department_id,
      },
    });
    prefix = prefix?.name ?? "EMP";
    employees[key].employee_no = `${prefix}-${employees[key].id}`;
  }

  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employees fetched successfully",
    data: employees,
  });
});

const getEmployeeById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id || company_id == undefined) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const employee = await employeeRepos.findOne({
    where: { id, company_id },
    include: [
      {
        model: departmentRepos,
        as: "department",
      },
      {
        model: designationRepos,
        as: "designation",
      },
    ],
  });

  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee fetched successfully",
    data: employee,
  });
});

// suspend employee
const suspendEmployee = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }

  const employee = await employeeRepos.findOne({
    where: { id, company_id },
  });
  if (!employee) {
    return next(
      new AppError(
        "Employee not found with associated company",
        STATUS_CODE.NOT_FOUND
      )
    );
  }
  employee.is_active = false;
  employee.is_suspended = true;
  employee.last_date_of_work = new Date();
  await employee.save();
  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee suspended successfully",
    data: employee,
  });
});

// basic info,address,documents,personal info ,salary,bank info, etc
const getBasicInfoById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }

  // Fetch basic info logic here
  const employee = await employeeRepos.findOne({
    where: { id, company_id },
    include: [
      {
        model: departmentRepos,
        as: "department",
      },
      {
        model: designationRepos,
        as: "designation",
      },
    ],
  });

  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee basic info fetched successfully",
    data: employee,
  });
});

const updateBasicInfoById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }

  // Update employee with req.body data
  const [upt, _] = await employeeRepos.upsert(
    {
      ...req.body,
      company_id,
      id,
    },
    {
      where: {
        company_id,
        id,
      },
    }
  );

  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee basic info updated successfully",
    data: upt,
  });
});

// upload profile
const uploadProfile = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }

  const employee = await employeeRepos.findOne({
    where: { id, company_id },
  });
  if (!employee) {
    return next(
      new AppError(
        "Employee not found with associated company",
        STATUS_CODE.NOT_FOUND
      )
    );
  }
  employee.profile = req.body?.profile;
  await employee.save();
  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee profile uploaded successfully",
    data: employee,
  });
});

// addresss
const getAddressById = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }

  const company = await companyRepos.findOne({
    attributes: ["country_id"],
    where: {
      id: company_id,
    },
  });

  const { id } = req.params;
  const employeeAddress =
    (await employeeAddressRepos.findOne({
      where: {
        company_id,
        employee_id: id,
      },
    })) ?? {};

  employeeAddress["country_id"] = company?.country_id;
  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee address fetched successfully",
    data: employeeAddress,
  });
});

const updateAddressById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  console.log(req.body);

  // Update employee with req.body data
  const addressExist = await employeeAddressRepos.findOne({
    where: {
      company_id,
      employee_id: id,
    },
  });
  if (!addressExist) {
    await employeeAddressRepos.create({
      ...req.body,
      company_id,
      employee_id: id,
    });
  } else {
    // update
    await employeeAddressRepos.update(
      {
        ...req.body,
      },
      {
        where: {
          company_id,
          employee_id: id,
        },
      }
    );
  }

  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee basic info updated successfully",
  });
});

// document
const getDocumentById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const employeeDocument = await employeeDocumentRepos.findAll({
    where: { employee_id: id, company_id },
    include: [
      {
        model: fileRepos,
        as: "file",
      },
      {
        model: documentCategoryRepos,
        as: "document_category",
      },
    ],
  });
  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee document fetched successfully",
    data: employeeDocument,
  });
});

// upload document
const uploadDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }

  const documents = req.body;

  for (const docs of documents) {
    try {
      const employeeDocument = await employeeDocumentRepos.create({
        ...docs,
        company_id,
        employee_id: id,
      });
      console.log("creating document ", employeeDocument.id);
    } catch (error) {
      return next(
        new AppError("Error creating document", STATUS_CODE.BAD_REQUEST)
      );
    }
  }

  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee document uploaded successfully",
    data: [],
  });
});

// delete document
const deleteDocumentById = catchAsync(async (req, res, next) => {
  const { id, employee_id } = req.params;
  if (!id || id == undefined || employee_id === undefined) {
    return next(
      new AppError("Document ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const employeeDocument = await employeeDocumentRepos.destroy({
    where: { employee_id, id, company_id },
  });
  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee document deleted successfully",
    data: employeeDocument,
  });
});

// personal information
const getPersonalInfoById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const employeePersonalInfo = await EmployeePersonalInformationRepos.findOne({
    where: { employee_id: id, company_id },
  });
  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee personal info fetched successfully",
    data: employeePersonalInfo,
  });
});

// update personal info
const updatePersonalInfoById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }

  const personalExist = await EmployeePersonalInformationRepos.findOne({
    where: {
      company_id,
      employee_id: id,
    },
  });

  if (!personalExist) {
    await EmployeePersonalInformationRepos.create({
      ...req.body,
      company_id,
      employee_id: id,
    });
  } else {
    await EmployeePersonalInformationRepos.update(
      {
        ...req.body,
      },
      {
        where: {
          company_id,
          employee_id: id,
        },
      }
    );
  }

  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee personal info updated successfully",
    data: null,
  });
});

// salary
const getSalaryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const employeeSalary = await employeeSalaryRepos.findOne({
    where: { employee_id: id, company_id },
  });
  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee salary fetched successfully",
    data: employeeSalary,
  });
});

const updateSalaryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const salaryExist = await employeeSalaryRepos.findOne({
    where: {
      company_id,
      employee_id: id,
    },
  });
  if (!salaryExist) {
    await employeeSalaryRepos.create({
      ...req.body,
      bonus: Number(req.body.bonus),
      company_id,
      employee_id: id,
    });
  } else {
    await employeeSalaryRepos.update(
      {
        ...req.body,
        bonus: Number(req.body.bonus),
      },
      {
        where: {
          company_id,
          employee_id: id,
        },
      }
    );
  }
  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee salary updated successfully",
    data: null,
  });
});

// Leave
const getLeaveById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const employeeLeave = await employeLeaveRepos.findAll({
    attributes: [
      "id",
      "leave_id",
      "leave_count",
      "leave_type",
      "leave_used",
      "leave_remaing",
    ],
    where: { employee_id: id, company_id },
    order: [["id", "ASC"]],
  });
  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee leave fetched successfully",
    data: employeeLeave,
  });
});

//update employee leave
const updateEmployeeLeaveById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || id == undefined) {
    return next(
      new AppError("Employee ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const { company_id } = req.user;
  if (!company_id) {
    return next(
      new AppError("Company ID is required", STATUS_CODE.BAD_REQUEST)
    );
  }
  const employeLeaves = req.body;
  for (leave of employeLeaves) {
    const {
      id: leave_id,
      leave_balance_to_add = 0,
      leave_balance_to_subtract = 0,
    } = leave;
    const getEmpLeave = await employeLeaveRepos.findOne({
      where: { employee_id: id, company_id, id: leave_id },
      raw: true,
    });

    if (!getEmpLeave) {
      return next(
        new AppError("employee leave not found", STATUS_CODE.BAD_REQUEST)
      );
    }

    if (getEmpLeave) {
      // update new count
      const new_update_leave =
        parseInt(getEmpLeave?.leave_remaing || 0) +
        parseInt(leave_balance_to_add);
      const new_update_leave_sub =
        parseInt(getEmpLeave?.leave_used || 0) +
        parseInt(leave_balance_to_subtract);

      if (new_update_leave < 0 || new_update_leave_sub < 0) {
        return next(
          new AppError(
            `Leave count can't be less than 0 for ${getEmpLeave?.leave_type}`,
            STATUS_CODE.BAD_REQUEST
          )
        );
      }

      if (leave_balance_to_add != 0) {
        await employeLeaveRepos.update(
          { leave_remaing: new_update_leave },
          { where: { employee_id: id, company_id, id: leave_id } }
        );
      }
      if (Math.abs(leave_balance_to_subtract) != 0) {
        await employeLeaveRepos.update(
          { leave_used: new_update_leave_sub },
          { where: { employee_id: id, company_id, id: leave_id } }
        );
      }
    }
  }
  res.status(STATUS_CODE.OK).json({
    success: true,
    message: "Employee leave updated successfully",
    data: null,
  });
});

module.exports = {
  uploadProfile,
  getLeaveById,
  updateEmployeeLeaveById,
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  suspendEmployee,
  getBasicInfoById,
  updateBasicInfoById,
  getAddressById,
  updateAddressById,

  getDocumentById,
  uploadDocument,
  deleteDocumentById,

  getPersonalInfoById,
  updatePersonalInfoById,

  getSalaryById,
  updateSalaryById,
};
