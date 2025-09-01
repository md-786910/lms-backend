const express = require("express");
const {
  salaryDashbaord,
  importSalartCurrentMonth,
  getSalaryHistory,
  generateSalary,
} = require("../controllers/salary.controller");
const { salaryHistoryRepos } = require("../repository/base");
const AppError = require("../utils/appError");

const router = express.Router();

router.get("/", getSalaryHistory);

router.route("/dashboard").get(salaryDashbaord);

router.post("/import-current-salary", importSalartCurrentMonth);

router.post("/generate-salary", generateSalary);

// view salary
router.get("/view", async (req, res, next) => {
  const { company_id } = req.user;
  console.log(req.query);
  if (!req.query) {
    return next(new AppError("body not found", 200));
  }
  const { employee_id, month_in_digit } = req.query;
  const salary = await salaryHistoryRepos.findOne({
    where: {
      company_id,
      employee_id,
      month_in_digit,
    },
  });
  if (!salary) {
    return next(new AppError("salary not found", 200));
  }
  const pdfbuffer = await salaryHistoryRepos.generatePDF({
    employee_id,
    company_id,
    is_launched: true,
  });
  if (!pdfbuffer) {
    return next(new AppError("Salary not generated", 200));
  }
  // generate pdf here
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=salary.pdf");
  res.send(pdfbuffer);

  res.end();
});

module.exports = router;
