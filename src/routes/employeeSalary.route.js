const express = require('express');
const router = express.Router();
const employeeSalaryController = require('../controllers/employeeSalary.controller');
const authenticate = require('../middleware/auth.middleware'); // JWT middleware

router.use(authenticate); // Protect all routes below

router.post('/', employeeSalaryController.createEmployeeSalary);
router.get('/', employeeSalaryController.getAllEmployeeSalaries);
router.get('/:id', employeeSalaryController.getEmployeeSalaryById);
router.put('/:id', employeeSalaryController.updateEmployeeSalary);
router.delete('/:id', employeeSalaryController.deleteEmployeeSalary);

module.exports = router;
