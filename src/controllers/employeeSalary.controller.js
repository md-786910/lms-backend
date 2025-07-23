const { EmployeeSalary } = require('../models');
const { Status_Codes, STATUS_CODE } = require('../constants/statusCode');
const { employeeSalarySchema } = require('../schema/employeeSalary.schema');

// Create
exports.createEmployeeSalary = async (req, res) => {
  try {
    const { error, value } = employeeSalarySchema.validate(req.body);
    if (error) return res.status(STATUS_CODE.BAD_REQUEST).json({ error: error.details[0].message });

    const salary = await EmployeeSalary.create(value);
    res.status(STATUS_CODE.CREATED).json({ message: 'Employee salary created', data: salary });
  } catch (err) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error', details: err.message });
  }
};

// Get All
exports.getAllEmployeeSalaries = async (req, res) => {
  try {
    const salaries = await EmployeeSalary.findAll();
    res.json({ data: salaries });
  } catch (err) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch salaries' });
  }
};

// Get by ID
exports.getEmployeeSalaryById = async (req, res) => {
  try {
    const salary = await EmployeeSalary.findByPk(req.params.id);
    if (!salary) return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'Not found' });
    res.json({ data: salary });
  } catch (err) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Server Error' });
  }
};

// Update
exports.updateEmployeeSalary = async (req, res) => {
  try {
    const { error, value } = employeeSalarySchema.validate(req.body);
    if (error) return res.status(STATUS_CODE.BAD_REQUEST).json({ error: error.details[0].message });

    const salary = await EmployeeSalary.findByPk(req.params.id);
    if (!salary) return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'Not found' });

    await salary.update(value);
    res.json({ message: 'Updated successfully', data: salary });
  } catch (err) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Update failed', details: err.message });
  }
};

// Delete
exports.deleteEmployeeSalary = async (req, res) => {
  try {
    const salary = await EmployeeSalary.findByPk(req.params.id);
    if (!salary) return res.status(STATUS_CODE.NOT_FOUND).json({ error: 'Not found' });

    await salary.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: 'Deletion failed' });
  }
};
