const {
  salaryHistoryRepos,
  employeeSalaryRepos,
  employeeRepos,
  designationRepos,
} = require("../repository/base");
const catchAsync = require("../utils/catchAsync");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const AppError = require("../utils/appError");
const { STATUS_CODE } = require("../constants/statusCode");
const db = require("../models");
const month_in_digit = dayjs().month() + 1;

const salaryDashbaord = catchAsync(async (req, res, next) => {
  if (!req.query) {
    return next(new AppError("query not found", STATUS_CODE.NOT_FOUND));
  }
  const { company_id } = req.user;

  // paid amount
  let paid_amount = 0;
  let pending_amount = 0;
  let total_netpay = 0;
  const salary = await salaryHistoryRepos.findAll({
    where: {
      company_id,
      month_in_digit,
      status: "paid",
    },
  });
  for (const sl of salary) {
    paid_amount += sl.net_salary;
  }

  // [pending]
  const pendingSalary = await salaryHistoryRepos.findAll({
    where: {
      company_id,
      month_in_digit,
      status: "pending",
    },
  });
  for (const sl of pendingSalary) {
    pending_amount += sl.net_salary;
  }

  total_netpay = paid_amount + pending_amount;

  res.status(200).json({
    status: true,
    message: "Salary dashboard fetched successfully",
    data: {
      paid_amount,
      pending_amount,
      total_netpay,
      employee_count: salary?.length + pendingSalary?.length,
    },
  });
});

// import salary current month with salary details per employee\

const importSalartCurrentMonth = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;

  const month = dayjs().format("MMMM");

  // check in if current month is already gen dont gen
  const monthSalaryExist = await salaryHistoryRepos.findOne({
    where: {
      company_id,
      month_in_digit,
    },
  });
  if (monthSalaryExist) {
    return next(
      new AppError(
        `Salary already generated for ${month} month`,
        STATUS_CODE.BAD_REQUEST
      )
    );
  }

  // fetch all employee salary with company
  const salary = await employeeSalaryRepos.findAll({
    where: {
      company_id,
    },
  });

  const transaction = await db.sequelize.transaction();
  try {
    for (const sl of salary) {
      const {
        salary_with_allowance,
        total_deduction_allowance,
        total_allowance,
        payable_salary,
        bonus,
        base_salary,
        employee_id,
      } = sl;
      await salaryHistoryRepos.create(
        {
          company_id,
          employee_id,
          month_in_digit,
          month,
          salary: salary_with_allowance || 0,
          deduction: total_deduction_allowance || 0,
          net_salary: payable_salary || 0,
          bonus: bonus || 0,
          base_salary: base_salary || 0,
          total_allowance: total_allowance || 0,
        },
        { transaction }
      );
    }
    await transaction.commit();
  } catch (error) {
    console.log({ error });
    await transaction.rollback();
    throw new AppError(error, STATUS_CODE.INTERNAL_SERVER_ERROR);
  }
  res.status(200).json({
    status: true,
    message: "Salary dashboard fetched successfully",
  });
});

const getSalaryHistory = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const query = req.query;
  if (!query) {
    return next(new AppError("query not found", STATUS_CODE.NOT_FOUND));
  }
  const { search = "", status = "all", month = month_in_digit } = query;

  let where = {
    company_id,
    month_in_digit: month,
  };
  if (status && status !== "all") {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      {
        "$employee.first_name$": {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  const salary = await salaryHistoryRepos.findAll({
    where,
    include: [
      {
        attributes: ["id", "first_name", "last_name", "employee_no"],
        model: employeeRepos,
        as: "employee",
        include: [
          {
            attributes: ["id", "title"],
            model: designationRepos,
            as: "designation",
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
  res.status(200).json({
    status: true,
    message: "Salary history fetched successfully",
    data: salary,
  });
});

const generateSalary = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  if (!req.body) {
    return next(new AppError("body not found", STATUS_CODE.NOT_FOUND));
  }
  const { employee_id } = req.body;
  const salary = await salaryHistoryRepos.findOne({
    where: {
      company_id,
      employee_id,
      month_in_digit,
    },
  });
  if (!salary) {
    return next(new AppError("salary not found", STATUS_CODE.NOT_FOUND));
  }

  const result = await salaryHistoryRepos.generatePDF({
    employee_id,
    company_id,
  });
  if (!result) {
    return next(new AppError("Salary not generated", STATUS_CODE.NOT_FOUND));
  }
  // generate pdf here
  salary.salary_slip = result;
  salary.status = "paid";
  await salary.save();
  res.status(200).json({
    status: true,
    message: "Salary generated successfully",
  });
});

module.exports = {
  salaryDashbaord,
  importSalartCurrentMonth,
  getSalaryHistory,
  generateSalary,
};
