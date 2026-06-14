const { Op } = require("sequelize");
const { leaveRepos, leaveRequestRepos } = require("../repository/base");

const roundLeave = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const normalizePolicy = (policy) => {
  const raw = policy?.toJSON ? policy.toJSON() : policy;
  const totalEntitlement = Number(raw?.annual_days || 0);
  const resetCycleMonths = Number(raw?.resetCycleMonths || 6);
  const monthlyAccrual =
    raw?.monthlyAccrual !== null && raw?.monthlyAccrual !== undefined
      ? Number(raw.monthlyAccrual)
      : resetCycleMonths
      ? totalEntitlement / 12
      : 0;

  return {
    ...raw,
    leaveType: raw?.type,
    totalEntitlement,
    monthlyAccrual,
    resetCycleMonths,
    carryForwardEnabled: raw?.carryForwardEnabled !== false,
    salaryDeductionEnabled: raw?.salaryDeductionEnabled !== false,
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
    const cycleEntitlement = roundLeave(
      (policy.totalEntitlement / 12) * policy.resetCycleMonths
    );
    const monthsAccrued = getMonthsAccruedInCycle(asOf, cycleStart, cycleEnd);
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
    const available = roundLeave(accrued - used);
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
      carriedForward: 0,
      remaining: available,
      unpaidLeave,
      excessLeave,
      totalEntitlement: policy.totalEntitlement,
      monthlyAccrual: policy.monthlyAccrual,
      resetCycleMonths: policy.resetCycleMonths,
      cycleEntitlement,
      accrued,
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
