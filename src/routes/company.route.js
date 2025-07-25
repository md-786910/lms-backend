const express = require("express");
const router = express.Router();
const companyController = require("../controllers/company.controller");
const { joiValidation } = require("../middleware/validation");
const { companyCreate, companyUpdate } = require("../schema/company.schema");

// Optionally add validation and auth middlewares here
router
  .route("/register")
  .post(joiValidation(companyCreate), companyController.createCompany);

//@ search company
router.get("/search", companyController.searchCompany);

// authenticated routes
router
  .route("/")
  .get(companyController.getCompanyById)
  .put(joiValidation(companyUpdate), companyController.updateCompany);
// .delete(companyController.deleteCompany);

module.exports = router;
