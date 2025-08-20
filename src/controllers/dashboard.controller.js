const { STATUS_CODE } = require("../constants/statusCode");
const {
  employeeRepos,
  leaveRequestRepos,
  employeLeaveRepos,
  activityRepos,
  prefixRepos,
} = require("../repository/base");
const catchAsync = require("../utils/catchAsync");
const dayjs = require("dayjs");
const { Op } = require("sequelize");

const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const getDashboard = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const total_employee = await employeeRepos.count({
    where: {
      company_id,
    },
  });
  const active_employee = await employeeRepos.count({
    where: { company_id, is_suspended: false },
  });

  const startOfToday = dayjs().tz("Asia/Kolkata").startOf("day").toDate();
  const endOfToday = dayjs().tz("Asia/Kolkata").endOf("day").toDate();
  let employeesOnLeaveToday = await leaveRequestRepos.findAll({
    attributes: ["status", "start_date", "end_date", "total_days", "leave_on"],
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
      {
        model: employeLeaveRepos,
        attributes: ["id", "leave_type"],
        as: "leave_type",
      },
    ],
    distinct: true,
    col: "employee_id",
  });

  // for (const key in employeesOnLeaveToday) {
  //   const department_id = employeesOnLeaveToday[key].employee?.department_id;
  //   let prefix = await prefixRepos.findOne({
  //     attributes: ["name"],
  //     where: {
  //       company_id,
  //       department_id,
  //     },
  //   });
  //   prefix = prefix?.name ?? "EMP";
  //   employeesOnLeaveToday[
  //     key
  //   ].employee.employee_no = `${prefix}-${employeesOnLeaveToday[key].employee?.id}`;
  // }

  //   activity
  const activities = await activityRepos.findAll({
    where: {
      company_id,
      // role: "admin",
    },
    limit: 4,
    order: [["createdAt", "DESC"]],
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Dashboard fetched successfully",
    data: {
      total_employee,
      active_employee,
      on_leave_today_count: employeesOnLeaveToday.length,
      on_leave_today: employeesOnLeaveToday,
      activities,
    },
  });
});

module.exports = {
  getDashboard,
};
