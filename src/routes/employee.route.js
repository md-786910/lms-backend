const express = require("express");
const router = express.Router();
const { joiValidation } = require("../middleware/validation");
const { createEmployee } = require("../controllers/employee.controller");
// Optionally add validation and auth middlewares here
router.post("/", joiValidation(createEmployee), createEmployee);
// router.get("/", employeeController.getAllEmployees);
// router.get("/:id", employeeController.getEmployeeById);
// router.put("/:id", employeeController.updateEmployee);
// router.delete("/:id", employeeController.deleteEmployee);

module.exports = router;
