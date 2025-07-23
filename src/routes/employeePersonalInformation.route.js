const express = require("express");
const router = express.Router();
const controller = require("../controllers/EmployeePersonalInformation.controller");
const { validateEmployeePersonal } = require("../schema/EmployeePersonalInformation.schema");
const { validateRequest } = require("../middleware/validateRequest");
const upload = require("../middleware/upload"); // Multer for file upload (if needed)
const { joiValidation } = require("../middleware/validation");

// Create
router.post("/",joiValidation(createEmployeeInfo), upload.none(), validateEmployeePersonal, validateRequest, controller.createEmployeeInfo);

// Get All
router.get("/", controller.getAllEmployeeInfo);

// Get by ID
router.get("/:id", controller.getEmployeeInfoById);

// Update
router.put("/:id", upload.none(), validateEmployeePersonal, validateRequest, controller.updateEmployeeInfo);

// Delete
router.delete("/:id", controller.deleteEmployeeInfo);

module.exports = router;
