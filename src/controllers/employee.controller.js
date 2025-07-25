const { STATUS_CODE } = require("../constants/statusCode");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { employeeRepos } = require("../repository/base");
const { generateToken } = require("../helpers/jwt");
const eventEmitter = require("../events/eventEmitter");
const eventObj = require("../events/events");

const createEmployee = catchAsync(async (req, res, next) => {
  if (!req.body) {
    return next(AppError("No data found", STATUS_CODE.OK));
  }
  const { company_id } = req.user;
  const employee = req.body;
  const newEmployee = await employeeRepos.create({ ...employee, company_id });

  //@crate token to employe to verifed itself and crate own password
  const token = await generateToken({
    id: newEmployee.id,
    email: newEmployee.email,
    company_id,
  });

  // @fire event to employe email
  eventEmitter.emit(eventObj.REGISTER_EMPLOYE, { createEmployee, token });
  res.status(STATUS_CODE.CREATED).json({
    success: true,
    message: "Employee created successfully",
    data: newEmployee,
  });
});

module.exports = {
  createEmployee,
  getAllEmployees: async (req, res) => {
    try {
      const employees = await Employee.findAll({
        include: [
          { model: Company, as: "company" },
          { model: EmployeePersonalInformation, as: "personal_info" },
        ],
      });

      res.status(STATUS_CODE.OK).json({
        success: true,
        data: employees,
      });
    } catch (error) {
      console.error("Get All Employees Error:", error);
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Server error while fetching employees",
      });
    }
  },

  //  Get Employee by ID
  getEmployeeById: async (req, res) => {
    try {
      const { id } = req.params;

      const employee = await Employee.findByPk(id, {
        include: [
          { model: Company, as: "company" },
          { model: EmployeePersonalInformation, as: "personal_info" },
        ],
      });

      if (!employee) {
        return res.status(STATUS_CODE.NOT_FOUND).json({
          success: false,
          message: "Employee not found",
        });
      }

      res.status(STATUS_CODE.OK).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      console.error("Get Employee by ID Error:", error);
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Server error while fetching employee",
      });
    }
  },

  // Update Employee
  updateEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const employee = await Employee.findByPk(id);
      if (!employee) {
        return res.status(STATUS_CODE.NOT_FOUND).json({
          success: false,
          message: "Employee not found",
        });
      }

      await employee.update(data);

      res.status(STATUS_CODE.OK).json({
        success: true,
        message: "Employee updated successfully",
        data: employee,
      });
    } catch (error) {
      console.error("Update Employee Error:", error);
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Server error while updating employee",
      });
    }
  },

  //  Delete Employee
  deleteEmployee: async (req, res) => {
    try {
      const { id } = req.params;

      const employee = await Employee.findByPk(id);
      if (!employee) {
        return res.status(STATUS_CODE.NOT_FOUND).json({
          success: false,
          message: "Employee not found",
        });
      }

      await employee.destroy();

      res.status(STATUS_CODE.OK).json({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (error) {
      console.error("Delete Employee Error:", error);
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Server error while deleting employee",
      });
    }
  },
};
