const { Op } = require("sequelize");
const dayjs = require("dayjs");

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const roundLeave = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const parseLeaveOn = (leaveOn) => {
  if (Array.isArray(leaveOn)) return leaveOn;
  if (!leaveOn) return [];
  if (typeof leaveOn === "string") {
    try {
      const parsed = JSON.parse(leaveOn);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
};

const addLeaveRequestToMonthlyMap = (monthlyByEmployeeAndType, leave, year) => {
  const employeeId = Number(leave.employee_id);
  const leaveTypeId = Number(leave.leave_type_id);
  if (!employeeId || !leaveTypeId) return;

  if (!monthlyByEmployeeAndType[employeeId]) {
    monthlyByEmployeeAndType[employeeId] = {};
  }
  if (!monthlyByEmployeeAndType[employeeId][leaveTypeId]) {
    monthlyByEmployeeAndType[employeeId][leaveTypeId] = Array(12).fill(0);
  }

  const leaveOn = parseLeaveOn(leave.leave_on);
  if (leaveOn.length > 0) {
    for (const day of leaveOn) {
      const dayDate = new Date(day.date);
      if (Number.isNaN(dayDate.getTime()) || dayDate.getFullYear() !== year) {
        continue;
      }
      const count = Number(day.count ?? (day.day === "full" ? 1 : 0.5)) || 0;
      monthlyByEmployeeAndType[employeeId][leaveTypeId][dayDate.getMonth()] += count;
    }
    return;
  }

  const startDate = new Date(leave.start_date);
  if (Number.isNaN(startDate.getTime()) || startDate.getFullYear() !== year) {
    return;
  }

  monthlyByEmployeeAndType[employeeId][leaveTypeId][startDate.getMonth()] +=
    Number(leave.total_days || 0);
};

const buildMonthlyLeaveMap = (leaveRequests, year) => {
  const monthlyByEmployeeAndType = {};
  for (const leave of leaveRequests) {
    addLeaveRequestToMonthlyMap(monthlyByEmployeeAndType, leave, year);
  }
  return monthlyByEmployeeAndType;
};

const calculatePolicyMonths = ({
  monthlyAvailed,
  annualDays,
  startMonth = 0,
  endMonth = 11,
}) => {
  const monthlyEntitlement = Number(annualDays || 0) / 12;
  const monthResults = Array(12)
    .fill(null)
    .map(() => ({
      availed: 0,
      deduction: 0,
      remaining: 0,
      available: 0,
    }));

  let carriedForward = 0;
  for (let monthIndex = startMonth; monthIndex <= endMonth; monthIndex += 1) {
    if (monthIndex === 0 || monthIndex === 6 || monthIndex === startMonth) {
      carriedForward = 0;
    }

    const availed = Number(monthlyAvailed?.[monthIndex] || 0);
    const available = monthlyEntitlement + carriedForward;
    const deduction = Math.max(0, availed - available);
    const used = availed - deduction;
    const remaining = Math.max(0, available - availed);

    monthResults[monthIndex] = {
      availed: roundLeave(availed),
      available: roundLeave(available),
      used: roundLeave(used),
      deduction: roundLeave(deduction),
      remaining: roundLeave(remaining),
      monthly_entitlement: roundLeave(monthlyEntitlement),
      previous_remaining_leave: roundLeave(carriedForward),
    };
    carriedForward = remaining;
  }

  return monthResults;
};

const buildEmployeeMonthlyAvailedMap = (leaveRequests, year) => {
  const monthlyByEmployee = {};
  const monthlyByEmployeeAndType = buildMonthlyLeaveMap(leaveRequests, year);

  for (const [employeeId, leaveTypeMap] of Object.entries(monthlyByEmployeeAndType)) {
    monthlyByEmployee[employeeId] = Array(12).fill(0);
    for (const monthlyAvailed of Object.values(leaveTypeMap)) {
      monthlyAvailed.forEach((value, monthIndex) => {
        monthlyByEmployee[employeeId][monthIndex] += Number(value || 0);
      });
    }
  }

  return monthlyByEmployee;
};

const getPeriodLeaveStats = ({ monthResults, startMonth, endMonth, total }) => {
  const months = monthResults.slice(startMonth, endMonth + 1);
  const availed = months.reduce(
    (sum, month) => sum + Number(month.availed || 0),
    0
  );
  const used = months.reduce((sum, month) => sum + Number(month.used || 0), 0);
  const deduction = months.reduce(
    (sum, month) => sum + Number(month.deduction || 0),
    0
  );
  const lastMonth = months[months.length - 1] || {};

  return {
    total: roundLeave(total),
    availed: roundLeave(availed),
    used: roundLeave(used),
    deduction: roundLeave(deduction),
    remaining: roundLeave(Number(lastMonth.remaining || 0)),
  };
};

const buildAggregateLeaveStats = ({
  employee_id,
  employeeLeaves,
  leaveRequests,
  year,
  asOfDate = new Date(),
}) => {
  const employeeId = Number(employee_id);
  const annualTotal = employeeLeaves.reduce(
    (sum, leave) => sum + Number(leave.leave_count || 0),
    0
  );
  const monthlyByEmployee = buildEmployeeMonthlyAvailedMap(leaveRequests, year);
  const monthlyAvailed = monthlyByEmployee[employeeId] || Array(12).fill(0);
  const monthResults = calculatePolicyMonths({
    monthlyAvailed,
    annualDays: annualTotal,
  });
  const currentMonth = new Date(asOfDate).getMonth();
  const isFirstCycle = currentMonth < 6;
  const firstCycle = getPeriodLeaveStats({
    monthResults,
    startMonth: 0,
    endMonth: 5,
    total: annualTotal / 2,
  });
  const secondCycle = getPeriodLeaveStats({
    monthResults,
    startMonth: 6,
    endMonth: 11,
    total: annualTotal / 2,
  });

  return {
    year,
    monthlyAvailed,
    monthResults,
    yearly: {
      total: roundLeave(annualTotal),
      availed: roundLeave(firstCycle.availed + secondCycle.availed),
      used: roundLeave(firstCycle.used + secondCycle.used),
      deduction: roundLeave(firstCycle.deduction + secondCycle.deduction),
      remaining: roundLeave(firstCycle.remaining + secondCycle.remaining),
    },
    firstCycle,
    secondCycle,
    currentCycle: isFirstCycle ? firstCycle : secondCycle,
    cycle: isFirstCycle ? "first" : "second",
    cycle_label: isFirstCycle ? "Jan-Jun" : "Jul-Dec",
    cycle_name: isFirstCycle ? "First Cycle" : "Second Cycle",
    cycle_start_month: isFirstCycle ? 1 : 7,
    cycle_end_month: isFirstCycle ? 6 : 12,
  };
};

const buildLeaveMonthlySummaryRecords = ({ employees, employeeLeaves, leaveRequests, year, prefixByDepartment = {} }) => {
  const monthlyByEmployee = buildEmployeeMonthlyAvailedMap(leaveRequests, year);
  const employeeLeaveMap = {};

  for (const employeeLeave of employeeLeaves) {
    const employeeId = Number(employeeLeave.employee_id);
    if (!employeeLeaveMap[employeeId]) {
      employeeLeaveMap[employeeId] = [];
    }
    employeeLeaveMap[employeeId].push(employeeLeave);
  }

  const summaries = [];
  const records = [];

  for (const employee of employees) {
    const employeeId = Number(employee.id);
    const pref = prefixByDepartment[employee.department_id] ?? "EMP";
    const summary = {
      employee_id: employeeId,
      name: `${employee.first_name} ${employee.last_name || ""}`.trim().toUpperCase(),
      employee_no: `${pref}-${employeeId}`,
      total: 0,
      total_deduction: 0,
    };

    for (const monthName of MONTH_NAMES) {
      summary[monthName] = 0;
      summary[`${monthName}_deduction`] = 0;
    }

    const policies = employeeLeaveMap[employeeId] || [];
    // Deduction uses the employee's total leave policy, even when leave is split by type.
    const annualDays = policies.reduce(
      (sum, policy) => sum + Number(policy.leave_count || 0),
      0
    );
    const companyId = Number(policies[0]?.company_id || employee.company_id || 0);
    const monthlyAvailed = monthlyByEmployee[employeeId] || Array(12).fill(0);
    const policyResults = calculatePolicyMonths({
      monthlyAvailed,
      annualDays,
    });

    policyResults.forEach((monthResult, monthIndex) => {
      const monthName = MONTH_NAMES[monthIndex];
      if (companyId) {
        records.push({
          company_id: companyId,
          employee_id: employeeId,
          leave_id: 0,
          leave_type: "All Leave",
          year,
          month: monthIndex + 1,
          month_name: monthName,
          cycle: monthIndex < 6 ? "first" : "second",
          monthly_entitlement: monthResult.monthly_entitlement,
          previous_remaining_leave: monthResult.previous_remaining_leave,
          available_leave: monthResult.available,
          leave_availed: monthResult.availed,
          leave_deduction: monthResult.deduction,
          remaining_leave: monthResult.remaining,
        });
      }
      summary[monthName] = roundLeave(monthResult.availed);
      summary[`${monthName}_deduction`] = roundLeave(monthResult.deduction);
      summary.total = roundLeave(summary.total + monthResult.availed);
      summary.total_deduction = roundLeave(summary.total_deduction + monthResult.deduction);
    });

    summaries.push(summary);
  }

  return { summaries, records };
};

const getYearRangeWhere = (year) => {
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
  return {
    [Op.or]: [
      { start_date: { [Op.between]: [startOfYear, endOfYear] } },
      { end_date: { [Op.between]: [startOfYear, endOfYear] } },
      {
        [Op.and]: [
          { start_date: { [Op.lte]: startOfYear } },
          { end_date: { [Op.gte]: endOfYear } },
        ],
      },
    ],
  };
};

const recomputeEmployeeLeaveBalance = async ({
  company_id,
  employee_id,
  leave_id,
  employeLeaveRepos,
  leaveRequestRepos,
  transaction,
  asOfDate = new Date(),
}) => {
  const asOf = dayjs(asOfDate);
  const year = asOf.year();
  const currentMonth = asOf.month();
  const cycleStartMonth = currentMonth < 6 ? 0 : 6;
  const cycleStart = new Date(year, cycleStartMonth, 1);
  const currentMonthEnd = asOf.endOf("month").toDate();

  const leaveWhere = { company_id, employee_id };
  if (leave_id) {
    leaveWhere.leave_id = leave_id;
  }

  const employeeLeaves = await employeLeaveRepos.findAll({
    where: leaveWhere,
    transaction,
  });

  for (const employeeLeave of employeeLeaves) {
    const leaveRequests = await leaveRequestRepos.findAll({
      where: {
        company_id,
        employee_id,
        leave_type_id: employeeLeave.leave_id,
        status: "approved",
        [Op.or]: [
          { start_date: { [Op.between]: [cycleStart, currentMonthEnd] } },
          { end_date: { [Op.between]: [cycleStart, currentMonthEnd] } },
          {
            [Op.and]: [
              { start_date: { [Op.lte]: cycleStart } },
              { end_date: { [Op.gte]: currentMonthEnd } },
            ],
          },
        ],
      },
      transaction,
    });

    const monthlyAvailed = buildMonthlyLeaveMap(leaveRequests, year)[employee_id]?.[
      employeeLeave.leave_id
    ] || Array(12).fill(0);

    const leaveUsed = monthlyAvailed
      .slice(cycleStartMonth, currentMonth + 1)
      .reduce((sum, value) => sum + Number(value || 0), 0);
    const cycleEntitlement = Number(employeeLeave.leave_count || 0) / 2;
    const policyUsed = Math.min(leaveUsed, cycleEntitlement);

    employeeLeave.leave_remaing = roundLeave(Math.max(0, cycleEntitlement - policyUsed));
    employeeLeave.leave_used = roundLeave(policyUsed);
    await employeeLeave.save({ transaction });
  }
};

const syncLeaveMonthlySummaryRecords = async ({
  employeeLeaveMonthlySummaryRepos,
  records,
  transaction,
}) => {
  if (!employeeLeaveMonthlySummaryRepos || !Array.isArray(records)) return;

  for (const record of records) {
    const where = {
      company_id: record.company_id,
      employee_id: record.employee_id,
      leave_id: record.leave_id,
      year: record.year,
      month: record.month,
    };

    const existing = await employeeLeaveMonthlySummaryRepos.findOne({
      where,
      transaction,
    });

    if (existing) {
      await existing.update(record, { transaction });
    } else {
      await employeeLeaveMonthlySummaryRepos.create(record, { transaction });
    }
  }
};

const recomputeEmployeeYearlyLeaveSummaryRecords = async ({
  company_id,
  employee_id,
  year,
  employeeRepos,
  employeLeaveRepos,
  leaveRequestRepos,
  employeeLeaveMonthlySummaryRepos,
  transaction,
}) => {
  const employeeWhere = { company_id };
  if (employee_id) {
    employeeWhere.id = employee_id;
  }

  const employeeLeaveWhere = { company_id };
  if (employee_id) {
    employeeLeaveWhere.employee_id = employee_id;
  }

  const leaveRequestWhere = {
    company_id,
    status: "approved",
    ...getYearRangeWhere(year),
  };
  if (employee_id) {
    leaveRequestWhere.employee_id = employee_id;
  }

  const [employees, employeeLeaves, leaveRequests] = await Promise.all([
    employeeRepos.findAll({
      where: employeeWhere,
      attributes: ["id", "first_name", "last_name", "department_id"],
      transaction,
    }),
    employeLeaveRepos.findAll({
      where: employeeLeaveWhere,
      transaction,
    }),
    leaveRequestRepos.findAll({
      where: leaveRequestWhere,
      transaction,
    }),
  ]);

  const { records } = buildLeaveMonthlySummaryRecords({
    employees,
    employeeLeaves,
    leaveRequests,
    year,
  });

  await syncLeaveMonthlySummaryRecords({
    employeeLeaveMonthlySummaryRepos,
    records,
    transaction,
  });

  return records;
};

module.exports = {
  MONTH_NAMES,
  buildAggregateLeaveStats,
  buildMonthlyLeaveMap,
  buildLeaveMonthlySummaryRecords,
  calculatePolicyMonths,
  getYearRangeWhere,
  recomputeEmployeeLeaveBalance,
  recomputeEmployeeYearlyLeaveSummaryRecords,
  roundLeave,
  syncLeaveMonthlySummaryRecords,
};
