const express = require("express");
const router = express.Router();
const { joiValidation, postCheckArray } = require("../middleware/validation");
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  suspendEmployee,
  getBasicInfoById,
  updateBasicInfoById,
  getAddressById,
  updateAddressById,
  getDocumentById,
  uploadDocument,
  deleteDocumentById,
  getPersonalInfoById,
  updatePersonalInfoById,
  getSalaryById,
  updateSalaryById,
  getLeaveById,
  updateEmployeeLeaveById,
  uploadProfile,
} = require("../controllers/employee.controller");
const {
  addEmployee,
  updateBasicInfo,
  updateAddress,
  updatePersonalInfo,
  uploadNewDocument,
  updateSalary,
  updateEmployeeLeave,
  updateProfilePics,
} = require("../schema/employee.schema");

router.post("/add", joiValidation(addEmployee), createEmployee);
router.get("/", getAllEmployees);

router.route("/:id").get(getEmployeeById);
router.delete("/suspend-employee/:id", suspendEmployee);

//basic info
router
  .route("/basic-info/:id")
  .get(getBasicInfoById)
  .put(joiValidation(updateBasicInfo), updateBasicInfoById);

router
  .route("/profile/:id")
  .put(joiValidation(updateProfilePics), uploadProfile);

// address
router
  .route("/address/:id")
  .get(getAddressById)
  .put(joiValidation(updateAddress), updateAddressById);

// personal info
router
  .route("/personal-info/:id")
  .get(getPersonalInfoById)
  .put(joiValidation(updatePersonalInfo), updatePersonalInfoById);

// documents
router
  .route("/document/:id")
  .get(getDocumentById)
  .post(postCheckArray(uploadNewDocument), uploadDocument);
router.delete("/document/:id/employee/:employee_id", deleteDocumentById);

// salary
router
  .route("/salary/:id")
  .get(getSalaryById)
  .put(joiValidation(updateSalary), updateSalaryById);

// leave
router
  .route("/leave/:id")
  .get(getLeaveById)
  .put(postCheckArray(updateEmployeeLeave), updateEmployeeLeaveById);

module.exports = router;
