const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { ENV_VARIABLE } = require("../constants/env");

const jwtExpiry = ENV_VARIABLE.JWT_EXPIRATION || 60; // Default to 60 minutes if not set

const generateToken = (user, expiration = "7d") => {
  return jwt.sign(
    {
      sub: user,
    },
    ENV_VARIABLE.JWT_SECRET,
    {
      expiresIn: expiration,
    }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, ENV_VARIABLE.JWT_SECRET);
};

const addMinutesToCurrentTime = (minutes) => {
  return new Date(new Date().getTime() + minutes * 60000);
};

const hashPassword = (password) => {
  return bcrypt.hash(password, 10);
};

const verifyHashPassword = (password, hashPassword) => {
  if (!password || !hashPassword) {
    throw new Error("Password or hashed password is missing");
  }
  return bcrypt.compare(password, hashPassword);
};

// const compileTemplateToHtml = (templatePath, data) => {
//   const templateHtml = readFileSync(templatePath, { encoding: "utf-8" });
//   const compiledTemplate = compile(templateHtml);
//   const outputHtml = compiledTemplate(data);
//   return outputHtml;
// };
const generateOTP = (length) => {
  let digits = "0123456789",
    OTP = "";
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

module.exports = {
  generateToken,
  verifyToken,
  addMinutesToCurrentTime,
  // compileTemplateToHtml,
  generateOTP,
  hashPassword,
  verifyHashPassword,
};
