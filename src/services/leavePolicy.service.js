const { Op } = require("sequelize");
const { employeLeaveRepos, leaveRequestRepos } = require("../repository/base");

const TOTAL_ANNUAL_LEAVE_DAYS = 18;
const LEAVE_POLICY_CONFIG = {
  casual: {
    annualLeaveDays: 12,
    cycleLeaveDays: 6,
    monthlyAccrualDays: 1,
  },
  sick: {
    annualLeaveDays: 6,
    cycleLeaveDays: 3,
    monthlyAccrualDays: 0.5,
  },
};
const CYCLE_MONTH_COUNT = 6;

const roundLeave = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const getCycleForDate = (date = new Date()) => {
  const target = new Date(date);
  const year = target.getFullYear();
  const monthIndex = target.getMonth();
  const cycleStartMonthIndex = monthIndex < CYCLE_MONTH_COUNT ? 0 : CYCLE_MONTH_COUNT;
  const cycleEndMonthIndex = cycleStartMonthIndex + CYCLE_MONTH_COUNT - 1;

  return {
    year,
    cycleStartMonth: cycleStartMonthIndex + 1,
    cycleEndMonth: cycleEndMonthIndex + 1,
    cycleStartDate: new Date(year, cycleStartMonthIndex, 1),
    cycleEndDate: new Date(year, cycleEndMonthIndex + 1, 0, 23, 59, 59, 999),
  };
};

const parseLeaveOn = (leaveOn) => {
  if (!leaveOn) return [];
  if (Array.isArray(leaveOn)) return leaveOn;

  try {
    const parsed = JSON.parse(leaveOn);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const getDayCount = (day) => {
  if (day?.count !== undefined && day?.count !== null) {
    return Number(day.count) || 0;
  }

  return day?.day === "half" ? 0.5 : 1;
};

const buildMonthlyLeaveTaken = (leaveRequests, cycle) => {
  const monthlyLeaveTaken = {};

  for (let month = cycle.cycleStartMonth; month <= cycle.cycleEndMonth; month += 1) {
    monthlyLeaveTaken[month] = 0;
  }

  for (const leaveRequest of leaveRequests || []) {
    const leaveOn = parseLeaveOn(leaveRequest.leave_on);

    if (leaveOn.length > 0) {
      for (const day of leaveOn) {
        const dayDate = new Date(day.date);
        const month = dayDate.getMonth() + 1;

        if (
          dayDate.getFullYear() === cycle.year &&
          month >= cycle.cycleStartMonth &&
          month <= cycle.cycleEndMonth
        ) {
          monthlyLeaveTaken[month] = roundLeave(monthlyLeaveTaken[month] + getDayCount(day));
        }
      }
      continue;
    }

    const startDate = new Date(leaveRequest.start_date);
    const month = startDate.getMonth() + 1;

    if (
      startDate.getFullYear() === cycle.year &&
      month >= cycle.cycleStartMonth &&
      month <= cycle.cycleEndMonth
    ) {
      monthlyLeaveTaken[month] = roundLeave(
        monthlyLeaveTaken[month] + Number(leaveRequest.total_days || 0)
      );
    }
  }

  return monthlyLeaveTaken;
};

const getLeavePolicyConfig = (leaveType, configuredAnnualDays) => {
  const normalizedType = String(leaveType || "").toLowerCase();

  if (normalizedType.includes("casual")) {
    return LEAVE_POLICY_CONFIG.casual;
  }

  if (normalizedType.includes("sick")) {
    return LEAVE_POLICY_CONFIG.sick;
  }

  const annualLeaveDays = Number(configuredAnnualDays || 0);
  return {
    annualLeaveDays,
    cycleLeaveDays: roundLeave(annualLeaveDays / 2),
    monthlyAccrualDays: roundLeave(annualLeaveDays / 12),
  };
};

const calculateLeavePolicy = (leaveRequests, date = new Date(), config = {}) => {
  const cycle = getCycleForDate(date);
  const targetMonth = new Date(date).getMonth() + 1;
  const monthlyLeaveTaken = buildMonthlyLeaveTaken(leaveRequests, cycle);
  const {
    annualLeaveDays = 0,
    cycleLeaveDays = 0,
    monthlyAccrualDays = 0,
  } = config;
  const months = [];
  let previousBalance = 0;
  let totalLeaveTaken = 0;
  let totalMonthlyUnpaidLeave = 0;

  for (let month = cycle.cycleStartMonth; month <= cycle.cycleEndMonth; month += 1) {
    const leaveTaken = roundLeave(monthlyLeaveTaken[month] || 0);
    const availableBalance = roundLeave(previousBalance + monthlyAccrualDays);
    const unpaidLeave = roundLeave(Math.max(0, leaveTaken - availableBalance));
    const currentBalance = roundLeave(Math.max(0, availableBalance - leaveTaken));

    totalLeaveTaken = roundLeave(totalLeaveTaken + leaveTaken);
    totalMonthlyUnpaidLeave = roundLeave(totalMonthlyUnpaidLeave + unpaidLeave);

    months.push({
      month,
      previousBalance,
      accrual: monthlyAccrualDays,
      availableBalance,
      leaveTaken,
      currentBalance,
      unpaidLeave,
    });

    previousBalance = currentBalance;
  }

  const currentMonth = months.find((month) => month.month === targetMonth) || months[0];
  const cycleExcessUnpaidLeave = roundLeave(Math.max(0, totalLeaveTaken - cycleLeaveDays));

  return {
    annualLeaveDays,
    cycleLeaveDays,
    monthlyAccrualDays,
    cycleStartMonth: cycle.cycleStartMonth,
    cycleEndMonth: cycle.cycleEndMonth,
    totalLeaveTaken,
    cycleExcessUnpaidLeave,
    totalMonthlyUnpaidLeave,
    currentBalance: currentMonth.currentBalance,
    unpaidLeave: currentMonth.unpaidLeave,
    monthly: months,
  };
};

const getApprovedLeaveRequestsForCycle = async ({
  company_id,
  employee_id,
  leave_type_id,
  date = new Date(),
  transaction,
}) => {
  const cycle = getCycleForDate(date);

  return leaveRequestRepos.findAll({
    where: {
      company_id,
      employee_id,
      leave_type_id,
      status: "approved",
      [Op.or]: [
        { start_date: { [Op.between]: [cycle.cycleStartDate, cycle.cycleEndDate] } },
        { end_date: { [Op.between]: [cycle.cycleStartDate, cycle.cycleEndDate] } },
        {
          [Op.and]: [
            { start_date: { [Op.lte]: cycle.cycleStartDate } },
            { end_date: { [Op.gte]: cycle.cycleEndDate } },
          ],
        },
      ],
    },
    transaction,
  });
};

const getLeavePolicyForEmployee = async ({
  company_id,
  employee_id,
  leave_type_id,
  date = new Date(),
  transaction,
}) => {
  const employeeLeave = await employeLeaveRepos.findOne({
    where: {
      company_id,
      employee_id,
      leave_id: leave_type_id,
    },
    transaction,
  });
  const config = getLeavePolicyConfig(
    employeeLeave?.leave_type,
    employeeLeave?.leave_count
  );
  const leaveRequests = await getApprovedLeaveRequestsForCycle({
    company_id,
    employee_id,
    leave_type_id,
    date,
    transaction,
  });

  return calculateLeavePolicy(leaveRequests, date, config);
};

const decorateEmployeeLeaveWithPolicy = async (employeeLeave, options = {}) => {
  const plainLeave = employeeLeave?.toJSON ? employeeLeave.toJSON() : { ...employeeLeave };
  const policy = await getLeavePolicyForEmployee({
    company_id: plainLeave.company_id || options.company_id,
    employee_id: plainLeave.employee_id || options.employee_id,
    leave_type_id: plainLeave.leave_id,
    date: options.date,
    transaction: options.transaction,
  });

  return {
    ...plainLeave,
    leave_count: policy.annualLeaveDays,
    leave_remaing: policy.currentBalance,
    leave_used: policy.totalLeaveTaken,
    unpaid_leave: policy.unpaidLeave,
    cycle_excess_unpaid_leave: policy.cycleExcessUnpaidLeave,
    leave_policy: policy,
  };
};

const syncEmployeeLeavePolicyBalance = async ({
  company_id,
  employee_id,
  leave_type_id,
  date = new Date(),
  transaction,
}) => {
  const policy = await getLeavePolicyForEmployee({
    company_id,
    employee_id,
    leave_type_id,
    date,
    transaction,
  });

  await employeLeaveRepos.update(
    {
      leave_count: policy.annualLeaveDays,
      leave_remaing: policy.currentBalance,
      leave_used: policy.totalLeaveTaken,
    },
    {
      where: {
        company_id,
        employee_id,
        leave_id: leave_type_id,
      },
      transaction,
    }
  );

  return policy;
};

const findDeductibleLeavesForEmployee = async ({ company_id, employee_id, transaction }) => {
  return employeLeaveRepos.findAll({
    where: {
      company_id,
      employee_id,
      [Op.or]: [
        { leave_type: { [Op.iLike]: "%casual%" } },
        { leave_type: { [Op.iLike]: "%sick%" } },
      ],
    },
    order: [["id", "ASC"]],
    transaction,
  });
};

const findAnnualLeaveForEmployee = async ({ company_id, employee_id, transaction }) => {
  const annualLeave = await employeLeaveRepos.findOne({
    where: {
      company_id,
      employee_id,
      [Op.or]: [
        { leave_type: { [Op.iLike]: "%annual%" } },
        { leave_type: { [Op.iLike]: "%casual%" } },
      ],
    },
    order: [["id", "ASC"]],
    transaction,
  });

  if (annualLeave) return annualLeave;

  return employeLeaveRepos.findOne({
    where: {
      company_id,
      employee_id,
    },
    order: [["id", "ASC"]],
    transaction,
  });
};

module.exports = {
  TOTAL_ANNUAL_LEAVE_DAYS,
  LEAVE_POLICY_CONFIG,
  calculateLeavePolicy,
  decorateEmployeeLeaveWithPolicy,
  findAnnualLeaveForEmployee,
  findDeductibleLeavesForEmployee,
  getCycleForDate,
  getLeavePolicyConfig,
  getLeavePolicyForEmployee,
  syncEmployeeLeavePolicyBalance,
};
