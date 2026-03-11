require("dotenv").config();
const db = require("../models");
const { Op } = require("sequelize");
const { leaveRequestRepos, employeeRepos, companyRepos } = require("../repository/base");
const sendEmail = require("../utils/sendMail");
const buildHtmlReport = require("../utils/leaveReportTemplate");
const { getMonthRange } = require("../config/appConfig");

async function generateApprovedLeaveSummary() {
  try {
    const range = getMonthRange("previous");
    const { startDate, endDate, monthName, year } = range;

    const companies = await companyRepos.findAll({
      // You can add more filtering here if needed, 
      // e.g., only companies with active subscriptions
    });

    for (const company of companies) {
      console.log(`Processing report for company: ${company.company_name} (ID: ${company.id})`);

      // Get all active employees for this company with their leave totals
      const results = await employeeRepos.findAll({
        where: {
          is_active: true,
          company_id: company.id,
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

      if (results.length === 0) {
        console.log(`No employees found for company ${company.company_name}. Skipping email.`);
        continue;
      }

      const templateRange = {
        monthName: monthName,
        prevYear: year,
      };

      const html = buildHtmlReport(results, templateRange);
      const subject = `Approved Leave Summary – ${monthName} ${year}`;

      const to = process.env.LEAVE_REPORT_TO || "hr@yourcompany.com";

      await sendEmail({
        to,
        subject,
        html,
      });

      console.log(`Leave report email sent successfully for ${company.company_name}.`);
    }

    console.log("All leave reports processed.");
    process.exit(0);
  } catch (err) {
    console.error("Error generating approved leave summary:", err);
    process.exit(1);
  }
}

generateApprovedLeaveSummary();
