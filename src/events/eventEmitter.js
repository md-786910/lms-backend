//configure event emitter
const eventObj = require("../events/events");
const EventEmiter = require("events");
const sendEmail = require("../utils/sendMail");
const {
  employeeRepos,
  leaveRequestRepos,
  userRepos,
  notificationRepos,
} = require("../repository/base");
const eventEmitter = new EventEmiter();

eventEmitter.on(eventObj.ADD_NEW_EMPLOYEE, async (data) => {
  const { employee, token } = data;

  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 40px; color: #333;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding: 30px; text-align: center; border-bottom: 1px solid #eee;">
          <h2 style="margin: 0; color: #2a2a2a;">🎉 Welcome to Our Company!</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px; font-size: 15px; line-height: 1.6; color: #555;">
          <p>Hello <strong>${employee.first_name} ${
    employee.last_name
  }</strong>,</p>
          <p>We’re excited to have you on board! Your account has been created successfully.  
          To get started, please set your password by clicking the button below:</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${
              process.env.APP_URL
            }/employee/verify-email?token=${token}" 
               style="background-color: #28a745; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
              Set Your Password
            </a>
          </div>
          
          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007BFF;">
            ${process.env.APP_URL}/employee/verify-email?token=${token}
          </p>
          
          <p>If you did not create this account, please ignore this email.</p>
          <p>We look forward to working with you!</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
          <p>© ${new Date().getFullYear()} Our Company. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </div>
`;

  const subject = "🎉 Welcome to Our Company – Set Up Your Account";
  // send email to employee
  await sendEmail({
    to: employee.email,
    subject,
    html,
  });
});

// Approved leave
eventEmitter.on(eventObj.APPROVED_LEAVE, async (data) => {
  const { employee_id, company_id, leave_request_id, leave_type } = data;
  const employee = await employeeRepos.findOne({
    attributes: ["first_name", "last_name", "email"],
    where: {
      company_id,
      id: employee_id,
    },
  });
  const leave = await leaveRequestRepos.findOne({
    where: {
      company_id,
      employee_id,
      id: leave_request_id,
    },
    raw: true,
  });
  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 40px; color: #333;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" 
           style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; 
                  box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding: 25px; text-align: center; border-bottom: 1px solid #eee;">
          <h2 style="margin: 0; color: #28a745;">✅ Leave Request Approved</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px; font-size: 15px; line-height: 1.6; color: #555;">
          <p>Hi <strong>${employee.first_name} ${
    employee.last_name
  }</strong>,</p>
          <p>Your leave request has been <strong style="color:#28a745;">approved</strong>.  
          Here are the details of your leave:</p>

          <table width="100%" cellspacing="0" cellpadding="10" 
                 style="background: #f8fdf8; border-radius: 6px; margin: 20px 0; font-size: 14px; border: 1px solid #e0e0e0;">
            <tr>
              <td style="font-weight: bold; width: 120px;">Leave Type:</td>
              <td>${leave_type}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Start Date:</td>
              <td>${new Date(leave?.start_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">End Date:</td>
              <td>${new Date(leave?.end_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Total Days:</td>
              <td>${leave.total_days}</td>
            </tr>
          </table>

          <p>We hope you enjoy your time off!</p>
          <p>Thank you,<br><strong>HR Team</strong></p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
          <p>© ${new Date().getFullYear()} Our Company. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </div>
`;

  const subject = "✅ Leave Request Approved";
  // send email to employee
  await sendEmail({
    to: employee.email,
    subject,
    html,
  });
});

// Reject leave
eventEmitter.on(eventObj.REJECTED_LEAVE, async (data) => {
  const { employee_id, company_id, leave_request_id } = data;
  const employee = await employeeRepos.findOne({
    attributes: ["first_name", "last_name", "email"],
    where: {
      company_id,
      id: employee_id,
    },
  });
  const leave = await leaveRequestRepos.findOne({
    where: {
      company_id,
      employee_id,
      id: leave_request_id,
    },
    raw: true,
  });
  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 40px; color: #333;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" 
           style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; 
                  box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding: 25px; text-align: center; border-bottom: 1px solid #eee;">
          <h2 style="margin: 0; color: #dc3545;">❌ Leave Request Rejected</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px; font-size: 15px; line-height: 1.6; color: #555;">
          <p>Hi <strong>${employee.first_name} ${
    employee.last_name
  }</strong>,</p>
          <p>We regret to inform you that your leave request has been <strong style="color:#dc3545;">rejected</strong>.  
          Here are the details of your request:</p>

          <table width="100%" cellspacing="0" cellpadding="10" 
                 style="background: #fdf8f8; border-radius: 6px; margin: 20px 0; font-size: 14px; border: 1px solid #e0e0e0;">
            <tr>
              <td style="font-weight: bold; width: 120px;">Start Date:</td>
              <td>${new Date(leave?.start_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">End Date:</td>
              <td>${new Date(leave?.end_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Total Days:</td>
              <td>${leave.total_days}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color:#dc3545;">Reason:</td>
              <td>${leave?.rejected_reason || "Not specified"}</td>
            </tr>
          </table>

          <p>If you have any questions, please contact the HR team.</p>
          <p>Thank you,<br><strong>HR Team</strong></p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
          <p>© ${new Date().getFullYear()} Our Company. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </div>
`;

  const subject = "❌ Leave Request Rejected";
  // send email to employee
  await sendEmail({
    to: employee.email,
    subject,
    html,
  });
});

// request leave by employee
eventEmitter.on(eventObj.LEAVE_REQUEST, async (data) => {
  const {
    employee_id,
    company_id,
    leave_type,
    start_date,
    end_date,
    total_days,
    leave_on,
    reason,
  } = data;
  const employee = await employeeRepos.findOne({
    attributes: ["first_name", "last_name", "email"],
    where: {
      company_id,
      id: employee_id,
    },
  });
  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 40px; color: #333;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" 
           style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; 
                  box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding: 25px; text-align: center; border-bottom: 1px solid #eee;">
          <h2 style="margin: 0; color: #007BFF;">📩 New Leave Request</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px; font-size: 15px; line-height: 1.6; color: #555;">
          <p>Hi <strong>${employee.first_name} ${
    employee.last_name
  }</strong>,</p>
          <p>You have submitted a new <strong>${leave_type}</strong> request.  
          Here are the details:</p>

          <table width="100%" cellspacing="0" cellpadding="10" 
                 style="background: #f8faff; border-radius: 6px; margin: 20px 0; font-size: 14px; border: 1px solid #e0e0e0;">
            <tr>
              <td style="font-weight: bold; width: 120px;">Start Date:</td>
              <td>${new Date(start_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">End Date:</td>
              <td>${new Date(end_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Total Days:</td>
              <td>${total_days}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Reason:</td>
              <td>${reason || "Not specified"}</td>
            </tr>
          </table>

          <p>Your request is pending review by the HR/Manager team. You’ll receive another notification once it’s approved or rejected.</p>
          <p>Thank you,<br><strong>HR Team</strong></p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
          <p>© ${new Date().getFullYear()} Our Company. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </div>
`;

  const subject = "📩 New Leave Request";
  // send email to employee
  await sendEmail({
    to: employee.email,
    subject,
    html,
  });
});

// NOTIFUCATION=================================================================
eventEmitter.on(eventObj.LEAVE_REQUEST, async (data) => {
  try {
    const { employee_id, company_id, leave_type } = data;
    const employee = await employeeRepos.findOne({
      attributes: ["first_name", "last_name", "email"],
      where: {
        company_id,
        id: employee_id,
      },
    });
    if (!employee) {
      throw new Error("Employee not found");
    }

    // get all admin user
    const users = await userRepos.findAll({
      attributes: ["id", "email"],
      where: {
        company_id,
        role: "admin",
      },
    });
    for (const user of users) {
      // send notification to admin
      await notificationRepos.notifyUser({
        user_id: user.id,
        company_id,
        title: "leave_request",
        message: `New leave request for ${leave_type} from ${employee.first_name} ${employee.last_name}`,
        role: "admin",
      });
    }
  } catch (error) {
    console.log({ error });
    throw new Error("Error processing leave request event");
  }
});

eventEmitter.on(eventObj.REJECTED_LEAVE, async (data) => {
  try {
    const { employee_id, company_id, leave_request_id } = data;
    const employee = await employeeRepos.findOne({
      attributes: ["first_name", "last_name", "email"],
      where: {
        company_id,
        id: employee_id,
      },
    });
    if (!employee) {
      throw new Error("Employee not found");
    }

    await notificationRepos.notifyUser({
      user_id: employee_id,
      company_id,
      title: "leave_request",
      message: `Your leave request has been rejected`,
      role: "employee",
    });
  } catch (error) {
    throw new Error(error.message);
  }
});

// approve
eventEmitter.on(eventObj.APPROVED_LEAVE, async (data) => {
  try {
    const { employee_id, company_id } = data;
    const employee = await employeeRepos.findOne({
      attributes: ["first_name", "last_name", "email"],
      where: {
        company_id,
        id: employee_id,
      },
    });
    if (!employee) {
      throw new Error("Employee not found");
    }
    await notificationRepos.notifyUser({
      user_id: employee_id,
      company_id,
      title: "leave_request",
      message: `Your leave request has been approved`,
      role: "employee",
    });
  } catch (error) {
    throw new Error(error.message);
  }
});

module.exports = eventEmitter;
