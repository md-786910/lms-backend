const { ENV_VARIABLE } = require("../constants/env");
const transporter = require("./nodemailer");

async function sendEmail({ to, subject, html, from = ENV_VARIABLE.SMTP_USER }) {
  if (!transporter) {
    console.error("❌ Transporter not initialized. Email not sent.");
    return;
  }

  //   process html with corect data mapping
  try {
    const info = await transporter.sendMail({
      from: from || `"MyApp Support" <${ENV_VARIABLE.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("mail sended to ", to);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

module.exports = sendEmail;
