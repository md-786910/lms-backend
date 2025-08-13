const dayjs = require("dayjs");
const { createLogger, format, transports } = require("winston");

const developmentFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`
  )
);
const productionFormat = format.combine(format.timestamp(), format.json());
const logger = createLogger({
  level: "info",
  format:
    process.env.NODE_ENV === "production"
      ? productionFormat
      : developmentFormat,
  transports: [
    new transports.Console(),
    ...(process.env.NODE_ENV === "production"
      ? [new transports.File({ filename: "logs/combined.log" })]
      : [new transports.File({ filename: "logs/error.log", level: "error" })]),
  ],
});

const convertToDate = (date) => {
  const formattedDate = dayjs(date).format("DD/MM/YYYY");
  return formattedDate;
};

module.exports = {
  logger,
  convertToDate,
};
