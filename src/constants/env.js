const ENV_VARIABLE = Object.freeze({
  API_VERSION: process.env.API_VERSION,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  REDIS_HOST: process.env.REDIS_HOST,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || "7d",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
});

module.exports = { ENV_VARIABLE };
