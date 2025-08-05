const {
  employeLeaveRepos,
  leaveRequestRepos,
  employeeRepos,
  activityRepos,
} = require("../../repository/base");
const catchAsync = require("../../utils/catchAsync");
const { Op } = require("sequelize");
const dayjs = require("dayjs");

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

  //   on leave today
  const startOfToday = dayjs().startOf("day").toDate();
  const endOfToday = dayjs().endOf("day").toDate();
  let employeesOnLeaveToday = await leaveRequestRepos.findAll({
    attributes: ["status"],
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

  const activities = await activityRepos.findAll({
    where: {
      company_id,
      employee_id: id,
    },
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({
    status: true,
    message: "Dashboard fetched successfully",
    data: {
      leave_balance,
      employeesOnLeaveToday,
      activities,
    },
  });
});

module.exports = {
  dashboard,
};
