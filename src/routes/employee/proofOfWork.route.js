const express = require("express");
const {
  createProofOfWork,
  getMyProofOfWork,
  getMyProofOfWorkById,
} = require("../../controllers/proofOfWork.controller");
const { createProofOfWork: createProofOfWorkSchema } = require("../../schema/proofOfWork.schema");
const { joiValidation } = require("../../middleware/validation");

const router = express.Router();

router
  .route("/")
  .get(getMyProofOfWork)
  .post(joiValidation(createProofOfWorkSchema), createProofOfWork);

router.get("/:id", getMyProofOfWorkById);

module.exports = router;
