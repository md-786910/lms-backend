const dayjs = require("dayjs");
const express = require("express");
const path = require("path");
const fs = require("fs");
const adminFileRouter = express.Router();
const month_in_digit = dayjs().month() + 1;
const year = dayjs().year();
// download file
adminFileRouter.get(
  "/download/employee/:id/month/:month/year/:year",
  (req, res) => {
    if (!req.params) {
      return res.status(404).json({ error: "Params not found" });
    }

    let { id: employee_id, month, year } = req.params;

    if (!employee_id || employee_id == undefined) {
      return res.status(404).json({ error: "Employee id not found" });
    }
    if (!month) {
      month = month_in_digit;
    }
    if (!year) {
      year = dayjs().year();
    }
    const fileName = "salary_slip.pdf";

    // Construct file path
    const folderPath = path.join(
      __dirname,
      `../document/${year}`,
      String(employee_id),
      String(month)
    );
    const filePath = path.join(folderPath, fileName);

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ error: "File not found" });
      }

      // Stream file as download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).send("Error downloading file");
        }
      });
    });
  }
);

module.exports = adminFileRouter;
