const {
  employeLeaveRepos,
  leaveRequestRepos,
  employeeRepos,
  activityRepos,
  employeeSalaryRepos,
} = require("../../repository/base");
const catchAsync = require("../../utils/catchAsync");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { getMonthRange } = require("../../config/appConfig");
const {
  buildAggregateLeaveStats,
  getYearRangeWhere,
} = require("../../utils/leaveCarryForward");
dayjs.extend(utc);
dayjs.extend(timezone);

const dashboard = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("User not found", STATUS_CODE.NOT_FOUND));
  }
  const { id, company_id } = req.user;
  const leave = await employeLeaveRepos.findAll({
    where: { employee_id: id, company_id },
  });
  const leave_balance = leave?.reduce((sum, leave) => {
    return sum + leave?.leave_remaing;
  }, 0);

  // salary
  const salary = await employeeSalaryRepos.findOne({
    attributes: ["payable_salary"],
    where: {
      employee_id: id,
      company_id,
    },
  });

  //   on leave today
  const startOfToday = dayjs().tz("Asia/Kolkata").startOf("day").toDate();
  const endOfToday = dayjs().tz("Asia/Kolkata").endOf("day").toDate();
  let employeesOnLeaveToday = await leaveRequestRepos.findAll({
    attributes: [
      "status",
      "start_date",
      "end_date",
      "total_days",
      "leave_on",
      "leave_type_id",
      "employee_id",
    ],
    where: {
      company_id,
      status: "approved",
      [Op.and]: [
        { start_date: { [Op.lte]: endOfToday } },
        { end_date: { [Op.gte]: startOfToday } },
      ],
    },
    include: [
      {
        model: employeeRepos,
        attributes: [
          "id",
          "first_name",
          "last_name",
          "employee_no",
          "department_id",
        ],
        as: "employee",
      },
      // {
      //   model: employeLeaveRepos,
      //   attributes: ["id", "leave_type"],
      //   as: "leave_type",
      // },
    ],
    distinct: true,
    col: "employee_id",
  });

  for (const key in employeesOnLeaveToday) {
    const empLeave = await employeLeaveRepos.findOne({
      attributes: ["id", "leave_type"],
      where: {
        company_id,
        employee_id: employeesOnLeaveToday[key].employee_id,
        leave_id: employeesOnLeaveToday[key].leave_type_id,
      },
    });
    employeesOnLeaveToday[key].dataValues.leave_type = empLeave;
  }

  const activities = await activityRepos.findAll({
    where: {
      company_id,
      employee_id: id,
      role: "employee",
    },
    limit: 4,
    order: [["createdAt", "DESC"]],
  });

  // Total leave and deduction for the current and previous month.
  // Calculate these from the yearly policy data so the dashboard uses the
  // same carry-forward/deduction rules as the leave summaries.
  const employee = await employeeRepos.findOne({
    where: { id, company_id },
    attributes: ["first_name", "last_name", "email"],
  });

  const getMonthlyLeaveSnapshot = async (range) => {
    const approvedRequests = await leaveRequestRepos.findAll({
      where: {
        company_id,
        employee_id: id,
        status: "approved",
        request_type: "policy",
        ...getYearRangeWhere(range.year),
      },
    });
    const stats = buildAggregateLeaveStats({
      employee_id: id,
      employeeLeaves: leave,
      leaveRequests: approvedRequests,
      year: range.year,
    });
    const month = stats.monthResults[range.monthIndex];

    if (!month || (month.availed <= 0 && month.deduction <= 0)) {
      return [];
    }

    return [
      {
        employee_id: id,
        employee,
        total_leave: month.availed,
        leave_availed: month.availed,
        leave_deduction: month.deduction,
      },
    ];
  };

  const previous_month_leaves = await getMonthlyLeaveSnapshot(
    getMonthRange("previous")
  );
  const current_month_leaves = await getMonthlyLeaveSnapshot(
    getMonthRange("current")
  );

  res.status(200).json({
    status: true,
    message: "Dashboard fetched successfully",
    data: {
      leave_balance,
      employeesOnLeaveToday,
      activities,
      net_salary: salary?.payable_salary || 0,
      current_month_leaves,
      previous_month_leaves,
    },
  });
});

module.exports = {
  dashboard,
};
