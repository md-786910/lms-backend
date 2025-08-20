const {
  employeeSalaryRepos,
  salaryHistoryRepos,
} = require("../../repository/base");
const catchAsync = require("../../utils/catchAsync");
const dayjs = require("dayjs");
const month_in_digit = dayjs().month() + 1;
const year = dayjs().year();

const getSalary = catchAsync(async (req, res, next) => {
  const { id, company_id } = req.user;
  const salary = await employeeSalaryRepos.findOne({
    where: { employee_id: id, company_id },
  });
  res.status(200).json({
    status: true,
    message: "Employee salary info fetched successfully",
    data: salary,
  });
});

const getSalaryHistory = catchAsync(async (req, res, next) => {
  const { id, company_id } = req.user;

  const salaryHistory = await salaryHistoryRepos.findAll({
    where: {
      employee_id: id,
      company_id,
      year,
    },
    raw: true,
  });
  const filteredSalaryHistory = salaryHistory?.map((record) => {
    if (record?.status === "paid") {
      return record;
    } else {
      const { salary_slip, ...rest } = record;
      return rest;
    }
  });
  res.status(200).json({
    status: true,
    message: "Employee salary info fetched successfully",
    data: filteredSalaryHistory,
  });
});

module.exports = {
  getSalary,
  getSalaryHistory,
};
