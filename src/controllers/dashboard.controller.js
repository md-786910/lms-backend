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

  //  on Leave today
  const today = dayjs().startOf("day").toDate();
  const tomorrow = dayjs().add(1, "day").startOf("day").toDate();

  //
  const startOfToday = dayjs().startOf("day").toDate(); // e.g., 2025-07-31T00:00:00+05:30
  const endOfToday = dayjs().endOf("day").toDate(); // e.g., 2025-07-31T23:59:59+05:30
  let employeesOnLeaveToday = await leaveRequestRepos.findAll({
    attributes: ["status"],
    where: {
      company_id,
      status: "approved",
      [Op.and]: [
        { start_date: { [Op.lte]: endOfToday } },
        { end_date: { [Op.gte]: startOfToday } },
      ],
      //   start_date: { [Op.gte]: today },
      //   end_date: { [Op.lte]: today },
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
