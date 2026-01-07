const express = require("express");
const { getDashboard, sendLeaveReport, downloadLeaveReport } = require("../controllers/dashboard.controller");

const router = express.Router();

router.route("/").get(getDashboard);
router.route("/send-report").post(sendLeaveReport);
router.route("/download-report").get(downloadLeaveReport);

module.exports = router;
