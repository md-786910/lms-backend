const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const employeeAddressController = require("../controllers/employeeAddress.controller");
const { joiValidation } = require("../middleware/validation");

router.use(authMiddleware); //  Protect all routes

router.post("/",joiValidation(createEmployeeAddress), employeeAddressController.createEmployeeAddress);
router.get("/", employeeAddressController.getAllEmployeeAddresses);
router.get("/:id", employeeAddressController.getEmployeeAddressById);
router.put("/:id", employeeAddressController.updateEmployeeAddress);
router.delete("/:id", employeeAddressController.deleteEmployeeAddress);

module.exports = router;
