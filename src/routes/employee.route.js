const express = require("express");
const router = express.Router();
const companyController = require("../controllers/employee.controller");
const { joiValidation } = require("../middleware/validation");

// Optionally add validation and auth middlewares here
router.post("/",joiValidation(createEmployee), employeeController.createEmployee);
router.get("/", employeeController.getAllEmployees);
router.get("/:id", employeeController.getEmployeeById);
router.put("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);

module.exports = router;
