const express = require("express");
const {
  getEmployeeProofOfWork,
  approveProofOfWork,
  rejectProofOfWork,
} = require("../controllers/proofOfWork.controller");
const {
  approveProofOfWork: approveProofOfWorkSchema,
  rejectProofOfWork: rejectProofOfWorkSchema,
} = require("../schema/proofOfWork.schema");
const { joiValidation } = require("../middleware/validation");

const router = express.Router();

router.get("/employee/:employee_id", getEmployeeProofOfWork);
router.post("/:id/approve", joiValidation(approveProofOfWorkSchema), approveProofOfWork);
router.post("/:id/reject", joiValidation(rejectProofOfWorkSchema), rejectProofOfWork);

module.exports = router;
