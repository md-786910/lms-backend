/**
 * Slick, professional HTML email design for Leave Summary Report
 */
function buildHtmlReport(results, { monthName, prevYear }) {
    const title = `Approved Leave Summary – ${monthName} ${prevYear}`;
    const generatedAt = new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    if (!results.length) {
        return `
      <div style="margin:0; padding:24px; background-color:#f3f4f6; font-family:Arial, sans-serif;">
        <div style="max-width:640px; margin:0 auto; background-color:#ffffff; border-radius:8px; border:1px solid #e5e7eb;">
          <div style="background:linear-gradient(90deg,#2563eb,#1d4ed8); padding:16px 24px; border-radius:8px 8px 0 0;">
            <h1 style="margin:0; font-size:18px; color:#ffffff;">${title}</h1>
            <div style="margin-top:6px; font-size:12px; color:#e5e7eb;">
              Generated on ${generatedAt}
            </div>
          </div>

          <div style="padding:20px 24px;">
            <p style="margin:0 0 12px 0; color:#4b5563; font-size:14px;">
              There are <strong>no approved leave records</strong> for ${monthName} ${prevYear}.
            </p>

            <p style="margin:0; color:#9ca3af; font-size:12px; border-top:1px solid #e5e7eb; padding-top:12px;">
              This email was generated automatically by the Leave Management System.
            </p>
          </div>
        </div>
      </div>
    `;
    }

    const totalEmployees = results.filter(
        (row) => parseFloat(row.get ? row.get("total_leave") : (row.total_leave || 0)) > 0
    ).length;
    const totalLeaveDays = results.reduce((sum, row) => {
        return sum + parseFloat(row.get ? row.get("total_leave") : (row.total_leave || 0));
    }, 0);

    let rowsHtml = "";
    let isAlt = false;

    results.forEach((row) => {
        const fullName =
            `${row.first_name || ""} ${row.last_name || ""}`.trim() || `#${row.id}`;
        const totalLeave = parseFloat(row.get ? row.get("total_leave") : (row.total_leave || 0)).toFixed(1);
        const rowBg = isAlt ? "#f9fafb" : "#ffffff";
        isAlt = !isAlt;

        rowsHtml += `
      <tr style="background-color:${rowBg};">
        <td style="padding:10px 14px; border-bottom:1px solid #e5e7eb; font-size:13px; color:#111827;">
          ${fullName}
        </td>
        <td style="padding:10px 14px; border-bottom:1px solid #e5e7eb; font-size:13px; text-align:right; color:#111827;">
          ${totalLeave}
        </td>
      </tr>
    `;
    });

    return `
    <div style="margin:0; padding:24px; background-color:#f3f4f6; font-family:Arial, sans-serif;">
      <div style="max-width:640px; margin:0 auto; background-color:#ffffff; border-radius:8px; border:1px solid #e5e7eb; box-shadow:0 8px 20px rgba(15,23,42,0.06);">
        
        <!-- Header -->
        <div style="background:linear-gradient(90deg,#2563eb,#1d4ed8); padding:16px 24px; border-radius:8px 8px 0 0; display:flex; align-items:center; justify-content:space-between;">
          <div>
            <h1 style="margin:0; font-size:18px; color:#ffffff; font-weight:600;">${title}</h1>
            <div style="margin-top:6px; font-size:12px; color:#e5e7eb;">
              Generated on ${generatedAt}
            </div>
          </div>
          <div style="background-color:#1d4ed8; padding:6px 10px; border-radius:999px; font-size:11px; color:#bfdbfe; text-transform:uppercase; letter-spacing:0.05em;">
            ${monthName} ${prevYear}
          </div>
        </div>

        <!-- Content -->
        <div style="padding:20px 24px 8px 24px;">
          <p style="margin:0 0 16px 0; color:#4b5563; font-size:14px; line-height:1.5;">
            Below is the summary of <strong>approved leaves</strong> taken by each employee in <strong>${monthName} ${prevYear}</strong>.
          </p>

          <!-- Summary stats -->
          <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
            <div style="flex:1 1 120px; min-width:120px; padding:10px 12px; border-radius:6px; background-color:#eff6ff; border:1px solid #bfdbfe;">
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#1d4ed8; margin-bottom:4px;">
                Employees on Leave
              </div>
              <div style="font-size:18px; font-weight:600; color:#1f2937;">
                ${totalEmployees}
              </div>
            </div>

            <div style="flex:1 1 120px; min-width:120px; padding:10px 12px; border-radius:6px; background-color:#ecfdf3; border:1px solid #bbf7d0;">
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#15803d; margin-bottom:4px;">
                Total Leave Days
              </div>
              <div style="font-size:18px; font-weight:600; color:#166534;">
                ${totalLeaveDays.toFixed(1)}
              </div>
            </div>
          </div>

          <!-- Table -->
          <table style="border-collapse:collapse; width:100%; border-radius:6px; overflow:hidden;">
            <thead>
              <tr style="background-color:#f9fafb;">
                <th style="padding:10px 14px; border-bottom:1px solid #e5e7eb; text-align:left; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">
                  Employee Name
                </th>
                <th style="padding:10px 14px; border-bottom:1px solid #e5e7eb; text-align:right; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">
                  Total Leave (days)
                </th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <p style="margin:16px 0 0 0; color:#9ca3af; font-size:11px; border-top:1px solid #e5e7eb; padding-top:10px;">
            This email was generated automatically by the Leave Management System. If you have any questions, please contact HR.
          </p>
        </div>
      </div>
    </div>
  `;
}

module.exports = buildHtmlReport;
