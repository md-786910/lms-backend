const nodemailer = require("nodemailer");

let transporter;

try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
    port: process.env.SMTP_PORT, // 465 (SSL) or 587 (TLS)
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP Connection failed:", error.message);
    } else {
      console.log("SMTP Connected:", success);
    }
  });
} catch (error) {
  console.error("Nodemailer transport creation failed:", error.message);
}

module.exports = transporter;
