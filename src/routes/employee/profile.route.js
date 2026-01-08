const express = require("express");
const {
  getProfile,
  getAddress,
  getDocument,
  getSalary,
  getPersonalInfo,
  uploadProfile,
} = require("../../controllers/employee/profile.controller");

const profileRouter = express.Router();

profileRouter.route("/basic").get(getProfile);
profileRouter.route("/address").get(getAddress);
profileRouter.route("/personal-info").get(getPersonalInfo);
profileRouter.route("/document").get(getDocument);
profileRouter.route("/salary").get(getSalary);
profileRouter.route("/upload-profile").put(uploadProfile);

module.exports = profileRouter;
