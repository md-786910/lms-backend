const { STATUS_CODE } = require("../constants/statusCode");
const {
  employeeRepos,
  leaveRequestRepos,
  employeLeaveRepos,
  employeeLeaveMonthlySummaryRepos,
  activityRepos,
  prefixRepos,
} = require("../repository/base");
const catchAsync = require("../utils/catchAsync");
const dayjs = require("dayjs");
const { Op } = require("sequelize");

const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { getMonthRange } = require("../config/appConfig");
const sendEmail = require("../utils/sendMail");
const buildHtmlReport = require("../utils/leaveReportTemplate");
const {
  buildLeaveMonthlySummaryRecords,
  getYearRangeWhere,
  syncLeaveMonthlySummaryRecords,
} = require("../utils/leaveCarryForward");

dayjs.extend(utc);
dayjs.extend(timezone);

const getMonthlyLeaveSummaryRows = async ({ company_id, range }) => {
  const [employees, employeeLeaves, leaveRequests] = await Promise.all([
    employeeRepos.findAll({
      where: {
        company_id,
        is_suspended: false,
      },
      attributes: ["id", "first_name", "last_name", "department_id"],
      order: [["first_name", "ASC"]],
    }),
    employeLeaveRepos.findAll({
      where: {
        company_id,
      },
    }),
    leaveRequestRepos.findAll({
      where: {
        company_id,
        status: "approved",
        ...getYearRangeWhere(range.year),
      },
    }),
  ]);

  const { summaries, records } = buildLeaveMonthlySummaryRecords({
    employees,
    employeeLeaves,
    leaveRequests,
    year: range.year,
  });

  await syncLeaveMonthlySummaryRecords({
    employeeLeaveMonthlySummaryRepos,
    records,
  });

  const monthName = range.monthName.toLowerCase();
  return summaries
    .map((summary) => {
      const [first_name = "", ...restName] = summary.name
        .split(" ")
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase());
      return {
        employee_id: summary.employee_id,
        first_name,
        last_name: restName.join(" "),
        total_leave: summary[monthName] || 0,
        leave_availed: summary[monthName] || 0,
        leave_deduction: summary[`${monthName}_deduction`] || 0,
      };
    })
    .sort((a, b) => {
      if (b.leave_availed !== a.leave_availed) {
        return b.leave_availed - a.leave_availed;
      }
      return b.leave_deduction - a.leave_deduction;
    });
};

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

  const pendingLeaveCount = await leaveRequestRepos.count({
    where: { company_id, status: "pending" },
  });

  const pendingLeaveRequests = await leaveRequestRepos.findAll({
    where: { company_id, status: "pending" },
    include: [
      {
        model: employeeRepos,
        as: "employee",
        attributes: [
          "id",
          "first_name",
          "last_name",
          "employee_no",
          "department_id",
        ],
      },
      {
        model: employeLeaveRepos,
        as: "leave_type",
        attributes: ["id", "leave_type"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 5,
  });

  for (const request of pendingLeaveRequests) {
    if (!request.employee) {
      continue;
    }
    let prefixName = "EMP";
    const departmentId = request.employee.department_id;
    if (departmentId) {
      const prefix = await prefixRepos.findOne({
        attributes: ["name"],
        where: {
          id: departmentId,
          company_id,
        },
      });
      prefixName = prefix?.name ?? prefixName;
    }
    if (!request.employee.employee_no) {
      request.employee.employee_no = `${prefixName}-${request.employee?.id}`;
    }
  }

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

  // Total leave employee - previous and current month
  const range1 = getMonthRange("previous");
  const previous_month_leaves = await getMonthlyLeaveSummaryRows({
    company_id,
    range: range1,
  });

  const range2 = getMonthRange("current");
  const current_month_leaves = await getMonthlyLeaveSummaryRows({
    company_id,
    range: range2,
  });

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Dashboard fetched successfully",
    data: {
      total_employee,
      active_employee,
      pending_leave: pendingLeaveCount,
      on_leave_today_count: employeesOnLeaveToday.length,
      on_leave_today: employeesOnLeaveToday,
      pending_leave_requests: pendingLeaveRequests,
      activities,
      previous_month_leaves,
      current_month_leaves,
    },
  });
});

const sendLeaveReport = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const range = getMonthRange("previous");
  const templateRange = {
    monthName: range.monthName,
    prevYear: String(range.year),
  };

  const results = await getMonthlyLeaveSummaryRows({
    company_id,
    range,
  });

  const html = buildHtmlReport(results, templateRange);
  const subject = `Approved Leave Summary - ${templateRange.monthName} ${templateRange.prevYear}`;
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
const escapeCsv = (value) => {
  const stringValue = String(value ?? "");
  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const downloadLeaveReport = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const range = getMonthRange("previous");

  const records = await getMonthlyLeaveSummaryRows({
    company_id,
    range,
  });

  const headers = [
    "Employee Name",
    "Leave Availed",
    "Leave Deduction",
    "Month",
    "Year",
  ];

  const rows = records.map((record) => {
    const name = `${record.first_name || ""} ${record.last_name || ""}`.trim();
    return [
      name,
      record.leave_availed ?? 0,
      record.leave_deduction ?? 0,
      range.monthName,
      range.year,
    ].map(escapeCsv).join(",");
  });

  const csv = [headers.map(escapeCsv).join(","), ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="leave_summary_${range.monthName}_${range.year}.csv"`
  );
  res.status(200).send(csv);
});
module.exports = {
  getDashboard,
  sendLeaveReport,
  downloadLeaveReport,
};


