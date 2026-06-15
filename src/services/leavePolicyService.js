const { Op } = require("sequelize");
const { leaveRepos, leaveRequestRepos } = require("../repository/base");

const roundLeave = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const readPolicyValue = (raw, camelKey, snakeKey, defaultValue) => {
  const value = raw?.[camelKey] ?? raw?.[snakeKey];
  return value === undefined || value === null ? defaultValue : value;
};

const readPolicyBoolean = (raw, camelKey, snakeKey, defaultValue = true) => {
  const value = readPolicyValue(raw, camelKey, snakeKey, defaultValue);
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return Boolean(value);
};

const normalizePolicy = (policy) => {
  const raw = policy?.toJSON ? policy.toJSON() : policy;
  const totalEntitlement = Number(raw?.annual_days || 0);
  const resetCycleMonths = Number(
    readPolicyValue(raw, "resetCycleMonths", "reset_cycle_months", 6)
  );
  const configuredMonthlyAccrual = readPolicyValue(
    raw,
    "monthlyAccrual",
    "monthly_accrual",
    null
  );
  const monthlyAccrual =
    configuredMonthlyAccrual !== null && configuredMonthlyAccrual !== undefined
      ? Number(configuredMonthlyAccrual)
      : resetCycleMonths
      ? totalEntitlement / 12
      : 0;

  return {
    ...raw,
    leaveType: raw?.type,
    totalEntitlement,
    monthlyAccrual,
    resetCycleMonths,
    carryForwardEnabled: readPolicyBoolean(
      raw,
      "carryForwardEnabled",
      "carry_forward_enabled",
      true
    ),
    salaryDeductionEnabled: readPolicyBoolean(
      raw,
      "salaryDeductionEnabled",
      "salary_deduction_enabled",
      true
    ),
    status: raw?.status || "active",
  };
};

const getCycleRange = (date = new Date(), resetCycleMonths = 6) => {
  const referenceDate = new Date(date);
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const cycleMonths = Math.max(1, Math.min(Number(resetCycleMonths || 6), 12));
  const cycleStartMonth = Math.floor(month / cycleMonths) * cycleMonths;
  const cycleStart = new Date(year, cycleStartMonth, 1, 0, 0, 0, 0);
  const cycleEnd = new Date(year, cycleStartMonth + cycleMonths, 0, 23, 59, 59, 999);

  return { cycleStart, cycleEnd };
};

const getMonthsAccruedInCycle = (date, cycleStart, cycleEnd) => {
  const effective = new Date(Math.min(new Date(date).getTime(), cycleEnd.getTime()));
  if (effective < cycleStart) return 0;
  return (
    (effective.getFullYear() - cycleStart.getFullYear()) * 12 +
    (effective.getMonth() - cycleStart.getMonth()) +
    1
  );
};

const getMonthRange = (date = new Date()) => {
  const target = new Date(date);
  const monthStart = new Date(
    target.getFullYear(),
    target.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
  const monthEnd = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return { monthStart, monthEnd };
};

const parseLeaveOn = (leaveOn) => {
  if (!leaveOn) return [];
  if (Array.isArray(leaveOn)) return leaveOn;
  try {
    return JSON.parse(leaveOn);
  } catch (error) {
    return [];
  }
};

const getLeaveDaysInsideCycle = (request, cycleStart, cycleEnd) => {
  const leaveOn = parseLeaveOn(request.leave_on);
  if (leaveOn.length) {
    return leaveOn.reduce((sum, day) => {
      const dayDate = new Date(day.date);
      if (dayDate >= cycleStart && dayDate <= cycleEnd) {
        return sum + Number(day.count || 0);
      }
      return sum;
    }, 0);
  }

  const start = new Date(request.start_date);
  const end = new Date(request.end_date);
  if (start <= cycleEnd && end >= cycleStart) {
    return Number(request.total_days || 0);
  }
  return 0;
};

const getLeaveDaysInsideRange = (request, rangeStart, rangeEnd) => {
  const leaveOn = parseLeaveOn(request.leave_on);
  if (leaveOn.length) {
    return leaveOn.reduce((sum, day) => {
      const dayDate = new Date(day.date);
      if (dayDate >= rangeStart && dayDate <= rangeEnd) {
        return sum + Number(day.count || 0);
      }
      return sum;
    }, 0);
  }

  const start = new Date(request.start_date);
  const end = new Date(request.end_date);
  if (start <= rangeEnd && end >= rangeStart) {
    return Number(request.total_days || 0);
  }
  return 0;
};

const calculateEmployeeLeaveBalances = async ({
  company_id,
  employee_id,
  asOf = new Date(),
  activeOnly = true,
}) => {
  const where = { company_id };
  if (activeOnly) {
    where.status = "active";
  }

  const policies = await leaveRepos.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });

  const balances = [];

  for (const policyModel of policies) {
    const policy = normalizePolicy(policyModel);
    const { cycleStart, cycleEnd } = getCycleRange(asOf, policy.resetCycleMonths);
    const { monthStart, monthEnd } = getMonthRange(asOf);
    const currentMonthStart =
      monthStart < cycleStart ? cycleStart : monthStart;
    const currentMonthEnd = monthEnd > cycleEnd ? cycleEnd : monthEnd;
    const previousPeriodEnd = new Date(currentMonthStart.getTime() - 1);
    const cycleEntitlement = roundLeave(
      (policy.totalEntitlement / 12) * policy.resetCycleMonths
    );
    const monthsAccrued = getMonthsAccruedInCycle(asOf, cycleStart, cycleEnd);
    const previousMonthsAccrued = Math.max(0, monthsAccrued - 1);
    const currentMonthAccrual = roundLeave(
      Math.min(policy.monthlyAccrual, cycleEntitlement)
    );
    const accruedBeforeCurrentMonth = roundLeave(
      Math.min(previousMonthsAccrued * policy.monthlyAccrual, cycleEntitlement)
    );
    const accrued = roundLeave(
      Math.min(monthsAccrued * policy.monthlyAccrual, cycleEntitlement)
    );

    const approvedRequests = await leaveRequestRepos.findAll({
      where: {
        company_id,
        employee_id,
        leave_type_id: policy.id,
        status: "approved",
        [Op.or]: [
          { start_date: { [Op.between]: [cycleStart, cycleEnd] } },
          { end_date: { [Op.between]: [cycleStart, cycleEnd] } },
          {
            [Op.and]: [
              { start_date: { [Op.lte]: cycleStart } },
              { end_date: { [Op.gte]: cycleEnd } },
            ],
          },
        ],
      },
    });

    const used = roundLeave(
      approvedRequests.reduce(
        (sum, request) => sum + getLeaveDaysInsideCycle(request, cycleStart, cycleEnd),
        0
      )
    );
    const usedBeforeCurrentMonth = roundLeave(
      approvedRequests.reduce(
        (sum, request) =>
          previousPeriodEnd >= cycleStart
            ? sum + getLeaveDaysInsideRange(request, cycleStart, previousPeriodEnd)
            : sum,
        0
      )
    );
    const currentMonthUsed = roundLeave(
      approvedRequests.reduce(
        (sum, request) =>
          sum + getLeaveDaysInsideRange(request, currentMonthStart, currentMonthEnd),
        0
      )
    );
    const carriedForward = policy.carryForwardEnabled
      ? roundLeave(accruedBeforeCurrentMonth - usedBeforeCurrentMonth)
      : 0;
    const available = roundLeave(
      policy.carryForwardEnabled
        ? accrued - used
        : currentMonthAccrual - currentMonthUsed
    );
    const unpaidLeave = roundLeave(Math.max(0, -available));
    const excessLeave = roundLeave(Math.max(0, used - cycleEntitlement));

    balances.push({
      id: policy.id,
      leave_id: policy.id,
      leave_type: policy.leaveType,
      leaveType: policy.leaveType,
      leave_count: policy.totalEntitlement,
      leave_remaing: available,
      leave_used: used,
      available,
      used,
      carriedForward,
      remaining: available,
      unpaidLeave,
      excessLeave,
      totalEntitlement: policy.totalEntitlement,
      monthlyAccrual: policy.monthlyAccrual,
      resetCycleMonths: policy.resetCycleMonths,
      cycleEntitlement,
      accrued,
      currentMonthAccrual,
      currentMonthUsed,
      usedBeforeCurrentMonth,
      cycleStart,
      cycleEnd,
      carryForwardEnabled: policy.carryForwardEnabled,
      salaryDeductionEnabled: policy.salaryDeductionEnabled,
      status: policy.status,
    });
  }

  return balances;
};

module.exports = {
  calculateEmployeeLeaveBalances,
  getCycleRange,
  normalizePolicy,
};
