const ENV_VARIABLE = Object.freeze({
API_VERSION: process.env.API_VERSION || "v1",
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT || 5432,
  DB_USER: process.env.DB_USER || "user",
  DB_PASSWORD: process.env.DB_PASSWORD || "password",
  DB_NAME: process.env.DB_NAME || "database",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
})

module.exports = { ENV_VARIABLE };

