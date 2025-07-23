const express = require("express");
const router = express.Router();
const companyController = require("../controllers/company.controller");
const { joiValidation } = require("../middleware/validation");
const { companyCreate } = require("../schema/company.schema");

// Optionally add validation and auth middlewares here
router.post("/",joiValidation(companyCreate), companyController.createCompany);
router.get("/", companyController.getAllCompanies);
router.get("/:id", companyController.getCompanyById);
router.put("/:id", companyController.updateCompany);
router.delete("/:id", companyController.deleteCompany);

module.exports = router;
