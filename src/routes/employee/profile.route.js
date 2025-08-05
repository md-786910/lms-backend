const express = require("express");
const {
  getProfile,
  getAddress,
  getDocument,
  getSalary,
  getPersonalInfo,
} = require("../../controllers/employee/profile.controller");

const profileRouter = express.Router();

profileRouter.route("/basic").get(getProfile);

profileRouter.get("/address", getAddress);

profileRouter.get("/perosnal-info", getPersonalInfo);

profileRouter.get("/document", getDocument);

profileRouter.get("/salary", getSalary);
module.exports = profileRouter;
