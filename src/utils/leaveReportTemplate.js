const getNumber = (row, key) => {
  if (row?.get) {
    return parseFloat(row.get(key) || 0);
  }
  return parseFloat(row?.[key] || 0);
};

const formatLeave = (value) => Number(value || 0).toFixed(1);

function buildHtmlReport(results, { monthName, prevYear }) {
  const title = `Approved Leave Summary - ${monthName} ${prevYear}`;
  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalEmployees = results.filter((row) => getNumber(row, "leave_availed") > 0).length;
  const totalLeaveAvailed = results.reduce((sum, row) => sum + getNumber(row, "leave_availed"), 0);
  const totalLeaveDeduction = results.reduce(
    (sum, row) => sum + getNumber(row, "leave_deduction"),
    0
  );

  const emptyState = `
    <tr>
      <td colspan="3" style="padding:18px 14px; border-bottom:1px solid #e5e7eb; font-size:13px; color:#64748b; text-align:center;">
        No leave data available for ${monthName} ${prevYear}.
      </td>
    </tr>
  `;

  const rowsHtml = results.length
    ? results
        .map((row, index) => {
          const fullName =
            `${row.first_name || ""} ${row.last_name || ""}`.trim() || `#${row.employee_id || row.id}`;
          const availed = formatLeave(row.leave_availed ?? row.total_leave);
          const deduction = formatLeave(row.leave_deduction);
          const rowBg = index % 2 === 0 ? "#ffffff" : "#f8fafc";

          return `
            <tr style="background-color:${rowBg};">
              <td style="padding:11px 14px; border-bottom:1px solid #e5e7eb; font-size:13px; color:#0f172a; line-height:1.35;">
                ${fullName}
              </td>
              <td style="padding:11px 14px; border-bottom:1px solid #e5e7eb; font-size:13px; text-align:right; color:#0f172a; font-weight:600; white-space:nowrap;">
                ${availed}
              </td>
              <td style="padding:11px 14px; border-bottom:1px solid #e5e7eb; font-size:13px; text-align:right; color:#be123c; font-weight:600; white-space:nowrap;">
                ${deduction}
              </td>
            </tr>
          `;
        })
        .join("")
    : emptyState;

  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @media only screen and (max-width: 600px) {
            .report-shell { padding: 12px !important; }
            .report-card { width: 100% !important; border-radius: 8px !important; }
            .report-header { padding: 16px !important; }
            .report-title { font-size: 17px !important; line-height: 1.3 !important; }
            .report-content { padding: 16px !important; }
            .stat-cell { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
            .report-table th, .report-table td { padding: 9px 8px !important; font-size: 12px !important; }
          }
        </style>
      </head>
      <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:Arial, sans-serif;">
        <div class="report-shell" style="margin:0; padding:24px; background-color:#f1f5f9;">
          <div class="report-card" style="max-width:720px; margin:0 auto; background-color:#ffffff; border-radius:8px; border:1px solid #dbe3ef; overflow:hidden;">
            <div class="report-header" style="background-color:#0f172a; padding:18px 22px;">
              <h1 class="report-title" style="margin:0; font-size:19px; color:#ffffff; font-weight:700;">
                ${title}
              </h1>
              <p style="margin:7px 0 0 0; font-size:12px; color:#cbd5e1;">
                Generated on ${generatedAt}
              </p>
            </div>

            <div class="report-content" style="padding:20px 22px;">
              <p style="margin:0 0 16px 0; color:#475569; font-size:14px; line-height:1.55;">
                Below is the monthly leave summary with leave availed and leave deduction for <strong>${monthName} ${prevYear}</strong>.
              </p>

              <table role="presentation" style="width:100%; border-collapse:collapse; margin-bottom:16px;">
                <tr>
                  <td class="stat-cell" style="width:33.33%; padding:0 8px 0 0;">
                    <div style="border:1px solid #bfdbfe; background-color:#eff6ff; border-radius:6px; padding:11px 12px;">
                      <div style="font-size:11px; color:#1d4ed8; font-weight:700; text-transform:uppercase;">Employees</div>
                      <div style="margin-top:5px; font-size:20px; color:#0f172a; font-weight:700;">${totalEmployees}</div>
                    </div>
                  </td>
                  <td class="stat-cell" style="width:33.33%; padding:0 4px;">
                    <div style="border:1px solid #bbf7d0; background-color:#f0fdf4; border-radius:6px; padding:11px 12px;">
                      <div style="font-size:11px; color:#15803d; font-weight:700; text-transform:uppercase;">Leave Availed</div>
                      <div style="margin-top:5px; font-size:20px; color:#166534; font-weight:700;">${formatLeave(totalLeaveAvailed)}</div>
                    </div>
                  </td>
                  <td class="stat-cell" style="width:33.33%; padding:0 0 0 8px;">
                    <div style="border:1px solid #fecdd3; background-color:#fff1f2; border-radius:6px; padding:11px 12px;">
                      <div style="font-size:11px; color:#be123c; font-weight:700; text-transform:uppercase;">Leave Deduction</div>
                      <div style="margin-top:5px; font-size:20px; color:#be123c; font-weight:700;">${formatLeave(totalLeaveDeduction)}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="width:100%; overflow-x:auto;">
                <table class="report-table" style="border-collapse:collapse; width:100%; min-width:420px; border:1px solid #e5e7eb; border-radius:6px; overflow:hidden;">
                  <thead>
                    <tr style="background-color:#f8fafc;">
                      <th style="padding:11px 14px; border-bottom:1px solid #e5e7eb; text-align:left; font-size:12px; font-weight:700; color:#475569; text-transform:uppercase;">
                        Employee Name
                      </th>
                      <th style="padding:11px 14px; border-bottom:1px solid #e5e7eb; text-align:right; font-size:12px; font-weight:700; color:#475569; text-transform:uppercase;">
                        Leave Availed
                      </th>
                      <th style="padding:11px 14px; border-bottom:1px solid #e5e7eb; text-align:right; font-size:12px; font-weight:700; color:#475569; text-transform:uppercase;">
                        Leave Deduction
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>

              <p style="margin:16px 0 0 0; color:#94a3b8; font-size:11px; border-top:1px solid #e5e7eb; padding-top:10px; line-height:1.5;">
                This email was generated automatically by the Leave Management System.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

module.exports = buildHtmlReport;
