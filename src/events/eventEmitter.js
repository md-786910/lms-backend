//configure event emitter
const eventObj = require("../events/events");
const EventEmiter = require("events");
const sendEmail = require("../utils/sendMail");
const { employeeRepos, leaveRequestRepos } = require("../repository/base");
const eventEmitter = new EventEmiter();

eventEmitter.on(eventObj.ADD_NEW_EMPLOYEE, async (data) => {
  const { employee, token } = data;

  const html = `<p>Welcome ${employee.first_name} ${employee.last_name},</p>
  <p>Your account has been created successfully. Please click the link below to set your password:</p>
  <a href=${process.env.APP_URL}/employee/verify-email?token=${token}>Set Password</a>
  <p>If you did not create this account, please ignore this email.</p>
  <p>Thank you!</p>`;

  const subject = "Welcome to Our Company";
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
  const html = `<p>Hi ${employee.first_name} ${employee.last_name},</p>
  <p>Your leave request has been approved.</p>
  <p>Leave details:</p>
  <ul>
    <li>Leave type: ${leave_type}</li>
    <li>Start date: ${new Date(leave?.start_date).toLocaleDateString()}</li>
    <li>End date: ${new Date(leave?.end_date).toLocaleDateString()}</li>
    <li>Total days: ${leave.total_days}</li>
  </ul>
  <p>Thank you!</p>`;

  const subject = "Leave Request Approved";
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
  const html = `<p>Hi ${employee.first_name} ${employee.last_name},</p>
  <p>Your leave request has been rejected.</p>
  <p>Leave details:</p>
  <ul>
    <li>Start date: ${new Date(leave?.start_date).toLocaleDateString()}</li>
    <li>End date: ${new Date(leave?.end_date).toLocaleDateString()}</li>
    <li>Total days: ${leave.total_days}</li>
  </ul>
  <p>Reason: ${leave.rejected_reason}</p>
  <p>Thank you!</p>`;

  const subject = "Leave Request Rejected";
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
  const html = `<p>Hi ${employee.first_name} ${employee.last_name},</p>
  <p>You have a new ${leave_type} request.</p>
  <p>Leave details:</p>
  <ul>
    <li>Start date: ${new Date(start_date).toLocaleDateString()}</li>
    <li>End date: ${new Date(end_date).toLocaleDateString()}</li>
    <li>Total days: ${total_days}</li>
  </ul>
  <p>Reason: ${reason}</p>
  <p>Thank you!</p>`;

  const subject = "New Leave Request";
  // send email to employee
  await sendEmail({
    to: employee.email,
    subject,
    html,
  });
});

module.exports = eventEmitter;
