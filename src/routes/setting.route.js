const express = require("express");
const {
  getPrefix,
  updatePrefix,
  getCurrency,
  updateCurrency,
  getDepartment,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
  getDesignation,
  createDesignation,
  getLeave,
  createLeave,
  getLeaveById,
  updateLeave,
  deleteLeave,
} = require("../controllers/setting.controller");
const { joiValidation } = require("../middleware/validation");
const router = express.Router();
const settingSchema = require("../schema/setting.schema");
// prefix
router.get("/prefix", getPrefix);
router.put(
  "/prefix/:id",
  joiValidation(settingSchema.updatePrefix),
  updatePrefix
);

// currency
router.get("/currency", getCurrency);
router.put(
  "/currency/:id",
  joiValidation(settingSchema.updateCurrency),
  updateCurrency
);

// departments
router
  .route("/department")
  .get(getDepartment)
  .post(joiValidation(settingSchema.updateCreateDepartment), createDepartment);
router
  .route("/department/:id")
  .get(getDepartmentById)
  .put(joiValidation(settingSchema.updateCreateDepartment), updateDepartment)
  .delete(deleteDepartment);

//designation
router
  .route("/designation")
  .get(getDesignation)
  .post(
    joiValidation(settingSchema.updateCreateDesignation),
    createDesignation
  );
router
  .route("/designation/:id")
  .get(getDesignationById)
  .put(joiValidation(settingSchema.updateCreateDesignation), updateDesignation)
  .delete(deleteDesignation);

// leave
router
  .route("/leave")
  .get(getLeave)
  .post(joiValidation(settingSchema.updateCreateLeave), createLeave);
router
  .route("/leave/:id")
  .get(getLeaveById)
  .put(joiValidation(settingSchema.updateCreateLeave), updateLeave)
  .delete(deleteLeave);

module.exports = router;
