const { Op } = require("sequelize");
const AppError = require("./appError");
const { STATUS_CODE } = require("../constants/statusCode");

const FLOATING_LEAVE_TYPE = "floating";
const POLICY_LEAVE_TYPE = "policy";
const FLOATING_LEAVE_LABEL = "Floating Leave";
const FLOATING_LEAVE_LIMIT = 2;

const holidayData = require("../data/holiday.json");

const formatDateOnly = (date) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const getRestrictedHoliday = (festivalDate, festivalName) => {
  const normalizedDate = formatDateOnly(festivalDate);
  if (!normalizedDate) return null;
  const today = formatDateOnly(new Date());
  const currentYear = new Date().getFullYear();
  const festivalYear = new Date(`${normalizedDate}T00:00:00`).getFullYear();
  if (festivalYear !== currentYear || normalizedDate < today) return null;

  for (const yearData of holidayData.holiday_data || []) {
    if (Number(yearData.year) !== currentYear) continue;
    const match = (yearData.restricted_holidays || []).find((holiday) => {
      return (
        holiday.date === normalizedDate &&
        (!festivalName || holiday.name === festivalName)
      );
    });
    if (match) return match;
  }

  return null;
};

const getCalendarYearRange = (year) => ({
  start: `${year}-01-01`,
  end: `${year}-12-31`,
});

const attachFloatingLeaveType = (leave) => {
  if (leave?.request_type === FLOATING_LEAVE_TYPE) {
    leave.dataValues.leave_type = {
      id: null,
      leave_id: null,
      leave_type: FLOATING_LEAVE_LABEL,
    };
  }
};

const validateFloatingLeaveRequest = async ({
  leaveRequestRepos,
  company_id,
  employee_id,
  festival_name,
  festival_date,
  justification,
}) => {
  const holiday = getRestrictedHoliday(festival_date, festival_name);
  if (!holiday) {
    throw new AppError(
      "Selected festival must be a restricted holiday",
      STATUS_CODE.BAD_REQUEST
    );
  }

  if (!String(justification || "").trim()) {
    throw new AppError("Justification is required", STATUS_CODE.BAD_REQUEST);
  }

  const year = new Date(holiday.date).getFullYear();
  const { start, end } = getCalendarYearRange(year);
  const usedCount = await leaveRequestRepos.count({
    where: {
      company_id,
      employee_id,
      request_type: FLOATING_LEAVE_TYPE,
      status: { [Op.in]: ["pending", "approved"] },
      festival_date: { [Op.between]: [start, end] },
    },
  });

  if (usedCount >= FLOATING_LEAVE_LIMIT) {
    throw new AppError(
      "Floating Leave limit reached for this year",
      STATUS_CODE.BAD_REQUEST
    );
  }

  return holiday;
};

module.exports = {
  FLOATING_LEAVE_LABEL,
  FLOATING_LEAVE_TYPE,
  POLICY_LEAVE_TYPE,
  attachFloatingLeaveType,
  formatDateOnly,
  validateFloatingLeaveRequest,
};
