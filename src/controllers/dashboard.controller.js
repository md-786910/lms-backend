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
const sequelize = require("sequelize");

const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { getMonthRange } = require("../config/appConfig");
const sendEmail = require("../utils/sendMail");
const buildHtmlReport = require("../utils/leaveReportTemplate");

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
    // const department_id = employeesOnLeaveToday[key].employee?.department_id;
    // let prefix = await prefixRepos.findOne({
    //   attributes: ["name"],
    //   where: {
    //     company_id,
    //     department_id,
    //   },
    // });
    // prefix = prefix?.name ?? "EMP";
    // employeesOnLeaveToday[
    //   key
    // ].employee.employee_no = `${prefix}-${employeesOnLeaveToday[key].employee?.id}`;
  }

  //   activity
  const activities = await activityRepos.findAll({
    where: {
      company_id,
      // role: "admin",
    },
    limit: 4,
    order: [["createdAt", "DESC"]],
  });

  // Total leave employee - prev month and next month
  const range1 = getMonthRange("previous");
  const previous_month_leaves = await employeeRepos.findAll({
    where: {
      company_id,
    },
    attributes: [
      "id",
      "first_name",
      "last_name",
      "email",
      [
        sequelize.fn(
          "COALESCE",
          sequelize.fn("SUM", sequelize.col("leaveRequests.total_days")),
          0
        ),
        "total_leave",
      ],
    ],
    include: [
      {
        model: leaveRequestRepos,
        as: "leaveRequests",
        required: false, // IMPORTANT: LEFT JOIN
        attributes: [],
        where: {
          status: "approved",
          start_date: {
            [Op.gte]: range1?.startDate,
            [Op.lt]: range1?.endDate,
          },
        },
      },
    ],
    group: ["Employee.id"],
    order: [[sequelize.literal("total_leave"), "DESC"]],
    raw: false,
  });

  // const previous_month_leaves = await leaveRequestRepos.findAll({
  //   where: {
  //     status: "approved",
  //     start_date: {
  //       [Op.gte]: range1?.startDate,
  //       [Op.lt]: range1?.endDate,
  //     },
  //   },
  //   attributes: [
  //     "employee_id",
  //     [sequelize.fn("SUM", sequelize.col("total_days")), "total_leave"],
  //   ],
  //   include: [
  //     {
  //       model: employeeRepos,
  //       as: "employee",
  //       attributes: ["first_name", "last_name", "email"],
  //     },
  //   ],
  //   group: ["employee_id", "employee.id"],
  //   order: [[sequelize.literal("total_leave"), "DESC"]],
  //   raw: false,
  // });

  // current month

  const range2 = getMonthRange("current");
  const current_month_leaves = await employeeRepos.findAll({
    where: {
      company_id,
    },
    attributes: [
      "id",
      "first_name",
      "last_name",
      "email",
      [
        sequelize.fn(
          "COALESCE",
          sequelize.fn("SUM", sequelize.col("leaveRequests.total_days")),
          0
        ),
        "total_leave",
      ],
    ],
    include: [
      {
        model: leaveRequestRepos,
        as: "leaveRequests",
        required: false, // IMPORTANT: LEFT JOIN
        attributes: [],
        where: {
          status: "approved",
          start_date: {
            [Op.gte]: range2?.startDate,
            [Op.lt]: range2?.endDate,
          },
        },
      },
    ],
    group: ["Employee.id"],
    order: [[sequelize.literal("total_leave"), "DESC"]],
    raw: false,
  });
  // const current_month_leaves = await leaveRequestRepos.findAll({
  //   where: {
  //     status: "approved",
  //     start_date: {
  //       [Op.gte]: range2?.startDate,
  //       [Op.lt]: range2?.endDate,
  //     },
  //   },
  //   attributes: [
  //     "employee_id",
  //     [sequelize.fn("SUM", sequelize.col("total_days")), "total_leave"],
  //   ],
  //   include: [
  //     {
  //       model: employeeRepos,
  //       as: "employee",
  //       attributes: ["first_name", "last_name", "email"],
  //     },
  //   ],
  //   group: ["employee_id", "employee.id"],
  //   order: [[sequelize.literal("total_leave"), "DESC"]],
  //   raw: false,
  // });

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Dashboard fetched successfully",
    data: {
      total_employee,
      active_employee,
      on_leave_today_count: employeesOnLeaveToday.length,
      on_leave_today: employeesOnLeaveToday,
      activities,
      previous_month_leaves,
      current_month_leaves,
    },
  });
});

const sendLeaveReport = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const range = getMonthRange("previous");
  const { startDate, endDate } = range;

  // Re-format range for template
  const dateObj = dayjs().subtract(1, "month");
  const templateRange = {
    monthName: dateObj.format("MMMM"),
    prevYear: dateObj.format("YYYY"),
  };

  const results = await employeeRepos.findAll({
    where: {
      company_id,
      is_active: true,
    },
    attributes: [
      "id",
      "first_name",
      "last_name",
      "email",
      [
        sequelize.fn(
          "COALESCE",
          sequelize.fn("SUM", sequelize.col("leaveRequests.total_days")),
          0
        ),
        "total_leave",
      ],
    ],
    include: [
      {
        model: leaveRequestRepos,
        as: "leaveRequests",
        required: false,
        attributes: [],
        where: {
          status: "approved",
          start_date: {
            [Op.gte]: startDate,
            [Op.lt]: endDate,
          },
        },
      },
    ],
    group: ["Employee.id"],
    order: [[sequelize.literal("total_leave"), "DESC"]],
    raw: false,
  });

  const html = buildHtmlReport(results, templateRange);
  const subject = `Approved Leave Summary – ${templateRange.monthName} ${templateRange.prevYear}`;
  const to = process.env.LEAVE_REPORT_TO || "hr@yourcompany.com";

  await sendEmail({
    to,
    subject,
    html,
  });

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Leave report email sent successfully",
  });
});

const downloadLeaveReport = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;

  const records = await leaveRequestRepos.findAll({
    where: { company_id },
    include: [
      {
        model: employeeRepos,
        as: "employee",
        attributes: ["first_name", "last_name", "employee_no"],
      },
      // {
      //   model: employeLeaveRepos,
      //   as: "leave_type",
      //   attributes: ["leave_type"],
      // },
    ],
    order: [
      [{ model: employeeRepos, as: "employee" }, "first_name", "ASC"],
    ],
  });

  for (const key in records) {
    const empLeave = await employeLeaveRepos.findOne({
      attributes: ["id", "leave_type"],
      where: {
        company_id,
        employee_id: records[key].employee_id,
        leave_id: records[key].leave_type_id,
      },
    });
    records[key].dataValues.leave_type = empLeave;
  }

  // Generate CSV
  const headers = [
    "Employee Name",
    "Employee No",
    "Leave Type",
    "Start Date",
    "End Date",
    "Total Days",
    "Status",
    "Reason",
  ].join(",");

  const rows = records.map((record) => {
    const name = `${record.employee?.first_name || ""} ${record.employee?.last_name || ""
      }`.trim();
    const empNo = record.employee?.employee_no || "";
    const type = record.dataValues.leave_type?.leave_type || "";
    const start = dayjs(record.start_date).format("YYYY-MM-DD");
    const end = dayjs(record.end_date).format("YYYY-MM-DD");
    const days = record.total_days || 0;
    const status = record.status || "";
    const reason = (record.reason || "").replace(/[,|\r|\n]/g, " "); // Basic CSV escaping

    return [name, empNo, type, start, end, days, status, reason].join(",");
  });

  const csv = [headers, ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="leave_records.csv"'
  );
  res.status(200).send(csv);
});

module.exports = {
  getDashboard,
  sendLeaveReport,
  downloadLeaveReport,
};
