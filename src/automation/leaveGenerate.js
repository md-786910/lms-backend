require("dotenv").config();
const db = require("../models");
const { Op } = require("sequelize");
const { leaveRequestRepos, employeeRepos } = require("../repository/base");
const sendEmail = require("../utils/sendMail");
const buildHtmlReport = require("../utils/leaveReportTemplate");

function getPreviousMonthRange() {
  const now = new Date();

  const currentMonth = now.getMonth(); // 0–11
  const currentYear = now.getFullYear();

  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const startDate = new Date(prevYear, prevMonthIndex, 1, 0, 0, 0, 0);
  const endDate = new Date(prevYear, prevMonthIndex + 1, 1, 0, 0, 0, 0);

  const prevMonth = prevMonthIndex + 1; // 1–12
  const monthName = startDate.toLocaleString("default", { month: "long" });

  return { startDate, endDate, prevMonth, prevYear, monthName };
}

async function generateApprovedLeaveSummary() {
  try {
    const range = getPreviousMonthRange();
    const { startDate, endDate, monthName, prevYear } = range;

    // Get all active employees with their leave totals (including those with 0 leaves)
    const results = await employeeRepos.findAll({
      where: {
        is_active: true,
        company_id: 2,
      },
      attributes: [
        "id",
        "first_name",
        "last_name",
        "email",
        [
          db.sequelize.fn(
            "COALESCE",
            db.sequelize.fn(
              "SUM",
              db.sequelize.col("leaveRequests.total_days")
            ),
            0
          ),
          "total_leave",
        ],
      ],
      include: [
        {
          model: leaveRequestRepos,
          as: "leaveRequests",
          attributes: [],
          required: false,
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
      order: [[db.sequelize.literal("total_leave"), "DESC"]],
      raw: false,
    });

    const html = buildHtmlReport(results, range);
    const subject = `Approved Leave Summary – ${monthName} ${prevYear}`;

    const to = process.env.LEAVE_REPORT_TO || "hr@yourcompany.com";

    await sendEmail({
      to,
      subject,
      html,
    });

    console.log("Leave report email sent successfully.");
  } catch (err) {
    console.error("Error generating approved leave summary:", err);
    process.exit(1);
  }
}

generateApprovedLeaveSummary();
