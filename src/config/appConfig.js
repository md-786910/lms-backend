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

const formatPrice = (amount, decimals = 2) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

function numberToWords(num) {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + inWords(n % 10000000) : "")
    );
  }

  return ("Indian Rupee " + inWords(num).trim() + " Only").replace(/\s+/g, " ");
}

/**
 * Get date range for a month based on type.
 *
 * @param {"current" | "previous" | "next"} type
 * @param {Date} [baseDate=new Date()]
 * @returns {{
 *   startDate: Date,
 *   endDate: Date,
 *   monthIndex: number,   // 0–11
 *   month: number,        // 1–12
 *   year: number,
 *   monthName: string
 * }}
 */
function getMonthRange(type = "current", baseDate = new Date()) {
  const now = new Date(baseDate); // avoid mutating incoming date
  let month = now.getMonth(); // 0–11
  let year = now.getFullYear();

  if (type === "previous") {
    month -= 1;
  } else if (type === "next") {
    month += 1;
  }

  // Normalize year + month (handles month < 0 and > 11)
  year = year + Math.floor(month / 12);
  month = ((month % 12) + 12) % 12; // stay in 0–11

  const startDate = new Date(year, month, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month + 1, 1, 0, 0, 0, 0);

  const monthIndex = month; // 0–11
  const monthNumber = month + 1; // 1–12
  const monthName = startDate.toLocaleString("default", { month: "long" });

  return {
    startDate,
    endDate,
    monthIndex,
    month: monthNumber,
    year,
    monthName,
  };
}

module.exports = {
  logger,
  convertToDate,
  formatPrice,
  numberToWords,
  getMonthRange,
};
