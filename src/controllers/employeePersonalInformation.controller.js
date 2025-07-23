const db = require("../models");
const { STATUS_CODE } = require("../constants/statusCode");

const EmployeePersonalInformation = db.EmployeePersonalInformation;

// Create Employee Personal Information
exports.createEmployeeInfo = async (req, res) => {
  try {   
    const data = req.body;

    const created = await EmployeePersonalInformation.create(data);

    return res.status(STATUS_CODE.CREATED).json({
      status: true,
      message: "Employee personal information created successfully",
      data: created,
    });
  } catch (error) {
    console.error("Error creating employee personal info:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to create employee personal information",
      error: error.message,
    });
  }
};

// Get All Employee Personal Information
exports.getAllEmployeeInfo = async (req, res) => {
  try {
    const records = await EmployeePersonalInformation.findAll();

    return res.status(STATUS_CODE.OK).json({
      status: true,
      message: "All employee personal information fetched",
      data: records,
    });
  } catch (error) {
    console.error("Error fetching all employee info:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to fetch employee personal information",
      error: error.message,
    });
  }
};

// Get Employee Personal Info by ID
exports.getEmployeeInfoById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await EmployeePersonalInformation.findByPk(id);

    if (!record) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        status: false,
        message: "Employee personal information not found",
      });
    }

    return res.status(STATUS_CODE.OK).json({
      status: true,
      message: "Employee personal information fetched",
      data: record,
    });
  } catch (error) {
    console.error("Error fetching employee info:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to fetch employee personal information",
      error: error.message,
    });
  }
};

//Update Employee Personal Info
exports.updateEmployeeInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const [updated] = await EmployeePersonalInformation.update(data, {
      where: { id },
    });

    if (!updated) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        status: false,
        message: "Employee personal information not found",
      });
    }

    const updatedRecord = await EmployeePersonalInformation.findByPk(id);

    return res.status(STATUS_CODE.OK).json({
      status: true,
      message: "Employee personal information updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error updating employee info:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to update employee personal information",
      error: error.message,
    });
  }
};

// Delete Employee Personal Info
exports.deleteEmployeeInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await EmployeePersonalInfo.destroy({
      where: { id },EmployeePersonalInformation
    });

    if (!deleted) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        status: false,
        message: "Employee personal information not found",
      });
    }

    return res.status(STATUS_CODE.OK).json({
      status: true,
      message: "Employee personal information deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting employee info:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to delete employee personal information",
      error: error.message,
    });
  }
};
