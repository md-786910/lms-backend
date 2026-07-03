const { STATUS_CODE } = require("../../constants/statusCode");
const eventEmitter = require("../../events/eventEmitter");
const eventObj = require("../../events/events");
const db = require("../../models");
const {
  employeLeaveRepos,
  leaveRequestRepos,
  activityRepos,
  employeeRepos,
  userRepos,
  extraWorkLeaveBalanceRepos,
  proofOfWorkSubmissionRepos,
} = require("../../repository/base");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const {
  buildAggregateLeaveStats,
  buildMonthlyLeaveMap,
  getYearRangeWhere,
  roundLeave,
} = require("../../utils/leaveCarryForward");
const {
  FLOATING_LEAVE_LABEL,
  FLOATING_LEAVE_TYPE,
  POLICY_LEAVE_TYPE,
  attachFloatingLeaveType,
  formatDateOnly,
  validateFloatingLeaveRequest,
} = require("../../utils/floatingLeave");
const {
  EXTRA_WORK_LEAVE_LABEL,
  EXTRA_WORK_LEAVE_TYPE,
  attachExtraWorkLeaveType,
  getExtraWorkBalance,
  validateExtraWorkLeaveAvailability,
} = require("../../utils/extraWorkLeave");

const getPolicyRequestTypeWhere = () => ({
  request_type: POLICY_LEAVE_TYPE,
});

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

const getCurrentCycleInfo = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const isFirstCycle = month < 6;
  const cycleStartMonth = isFirstCycle ? 0 : 6;
  const cycleEndMonth = isFirstCycle ? 5 : 11;

  return {
    cycle: isFirstCycle ? "first" : "second",
    cycle_label: isFirstCycle ? "Jan-Jun" : "Jul-Dec",
    cycle_name: isFirstCycle ? "First Cycle" : "Second Cycle",
    cycle_start_month: cycleStartMonth + 1,
    cycle_end_month: cycleEndMonth + 1,
    year,
    startDate: new Date(year, cycleStartMonth, 1),
    endDate: new Date(year, cycleEndMonth + 1, 0, 23, 59, 59, 999),
  };
};

const getLeaveDaysInsideRange = (leave, range) => {
  const leaveOn = parseLeaveOn(leave.leave_on);
  if (leaveOn.length > 0) {
    return leaveOn.reduce((sum, day) => {
      const dayDate = new Date(day.date);
      if (
        Number.isNaN(dayDate.getTime()) ||
        dayDate < range.startDate ||
        dayDate > range.endDate
      ) {
        return sum;
      }
      return sum + Number(day.count ?? (day.day === "full" ? 1 : 0.5));
    }, 0);
  }

  const startDate = new Date(leave.start_date);
  if (
    Number.isNaN(startDate.getTime()) ||
    startDate < range.startDate ||
    startDate > range.endDate
  ) {
    return 0;
  }

  return Number(leave.total_days || 0);
};

const getAllLeave = catchAsync(async (req, res, next) => {
  const { id, company_id } = req.user;
  const cycleInfo = getCurrentCycleInfo();
  const leaves = await employeLeaveRepos.findAll({
    where: { employee_id: id, company_id },
  });

  const approvedYearlyRequests = await leaveRequestRepos.findAll({
    where: {
      company_id,
      employee_id: id,
      status: "approved",
      ...getPolicyRequestTypeWhere(),
      ...getYearRangeWhere(cycleInfo.year),
    },
  });
  const monthlyByEmployeeAndType = buildMonthlyLeaveMap(
    approvedYearlyRequests,
    cycleInfo.year
  );
  const monthlyByType = monthlyByEmployeeAndType[Number(id)] || {};
  const cycleStartMonth = cycleInfo.cycle_start_month - 1;
  const cycleEndMonth = cycleInfo.cycle_end_month - 1;
  const aggregateStats = buildAggregateLeaveStats({
    employee_id: id,
    employeeLeaves: leaves,
    leaveRequests: approvedYearlyRequests,
    year: cycleInfo.year,
  });

  const cycleLeaves = leaves.map((leave) => {
    const monthlyAvailed =
      monthlyByType[Number(leave.leave_id)] || Array(12).fill(0);
    const cycleAvailed = roundLeave(
      monthlyAvailed
        .slice(cycleStartMonth, cycleEndMonth + 1)
        .reduce((sum, value) => sum + Number(value || 0), 0)
    );

    leave.dataValues.cycle_leave_count = null;
    leave.dataValues.cycle_leave_availed = cycleAvailed;
    leave.dataValues.cycle_leave_used = cycleAvailed;
    leave.dataValues.cycle_leave_remaining = null;
    leave.dataValues.cycle_leave_deduction = null;
    leave.dataValues.cycle = aggregateStats.cycle;
    leave.dataValues.cycle_label = aggregateStats.cycle_label;
    leave.dataValues.cycle_name = aggregateStats.cycle_name;

    return leave;
  });

  let total_pending = await leaveRequestRepos.findAll({
    where: {
      company_id,
      employee_id: id,
      status: "pending",
      ...getPolicyRequestTypeWhere(),
      [db.Sequelize.Op.or]: [
        { start_date: { [db.Sequelize.Op.between]: [cycleInfo.startDate, cycleInfo.endDate] } },
        { end_date: { [db.Sequelize.Op.between]: [cycleInfo.startDate, cycleInfo.endDate] } },
        {
          [db.Sequelize.Op.and]: [
            { start_date: { [db.Sequelize.Op.lte]: cycleInfo.startDate } },
            { end_date: { [db.Sequelize.Op.gte]: cycleInfo.endDate } },
          ],
        },
      ],
    },
  });

  total_pending = total_pending?.reduce((sum, leave) => {
    return sum + getLeaveDaysInsideRange(leave, cycleInfo);
  }, 0);
  const extraWorkLeaveBalance = await getExtraWorkBalance({
    extraWorkLeaveBalanceRepos,
    company_id,
    employee_id: id,
  });

  const firstCycleStart = new Date(cycleInfo.year, 0, 1);
  const firstCycleEnd = new Date(cycleInfo.year, 5, 30, 23, 59, 59, 999);
  const secondCycleStart = new Date(cycleInfo.year, 6, 1);
  const secondCycleEnd = new Date(cycleInfo.year, 11, 31, 23, 59, 59, 999);

  const getCycleExtraWork = async (startDate, endDate) => {
    const submissions = await proofOfWorkSubmissionRepos.findAll({
      where: {
        company_id,
        employee_id: id,
        status: "approved",
        work_date: {
          [db.Sequelize.Op.between]: [startDate, endDate],
        },
      },
      attributes: ["working_hours"],
      raw: true,
    });

    return submissions.reduce(
      (sum, submission) =>
        sum + (submission.working_hours === "half_day" ? 0.5 : 1),
      0
    );
  };

  const firstCycleExtraWork = await getCycleExtraWork(firstCycleStart, firstCycleEnd);
  const secondCycleExtraWork = await getCycleExtraWork(secondCycleStart, secondCycleEnd);

  res.status(200).json({
    status: true,
    message: "Leaves fetched successfully",
    data: {
      cycle: cycleInfo.cycle,
      cycle_label: cycleInfo.cycle_label,
      cycle_name: cycleInfo.cycle_name,
      cycle_start_month: cycleInfo.cycle_start_month,
      cycle_end_month: cycleInfo.cycle_end_month,
      cycle_total: aggregateStats.currentCycle.total,
      cycle_availed: aggregateStats.currentCycle.availed,
      cycle_used: aggregateStats.currentCycle.used,
      cycle_remaining: aggregateStats.currentCycle.remaining,
      cycle_deduction: aggregateStats.currentCycle.deduction,
      yearly_total: aggregateStats.yearly.total,
      yearly_availed: aggregateStats.yearly.availed,
      yearly_used: aggregateStats.yearly.used,
      yearly_remaining: aggregateStats.yearly.remaining,
      yearly_deduction: aggregateStats.yearly.deduction,
      first_cycle_leave_summary: {
        year: cycleInfo.year,
        cycle: "first",
        cycle_label: "Jan-Jun",
        cycle_name: "First Cycle",
        total: aggregateStats.firstCycle.total,
        availed: aggregateStats.firstCycle.availed,
        used: aggregateStats.firstCycle.used,
        remaining: aggregateStats.firstCycle.remaining,
        deduction: aggregateStats.firstCycle.deduction,
        extra_work: firstCycleExtraWork,
      },
      second_cycle_leave_summary: {
        year: cycleInfo.year,
        cycle: "second",
        cycle_label: "Jul-Dec",
        cycle_name: "Second Cycle",
        total: aggregateStats.secondCycle.total,
        availed: aggregateStats.secondCycle.availed,
        used: aggregateStats.secondCycle.used,
        remaining: aggregateStats.secondCycle.remaining,
        deduction: aggregateStats.secondCycle.deduction,
        extra_work: secondCycleExtraWork,
      },
      leaves: cycleLeaves,
      total_approved: aggregateStats.currentCycle.availed,
      total_pending: roundLeave(total_pending),
      total_remaining: aggregateStats.currentCycle.remaining,
      extra_work_leave_balance: extraWorkLeaveBalance,
    },
  });
});

const getAllLeaveRequest = catchAsync(async (req, res, next) => {
  const { id, company_id } = req.user;
  const leaves = await leaveRequestRepos.findAll({
    where: { employee_id: id, company_id },
    order: [
      [
        db.Sequelize.literal(`
            CASE
              WHEN status = 'pending' THEN 1
              WHEN status = 'approved' THEN 2
              WHEN status = 'rejected' THEN 3
              ELSE 4
            END
          `),
        "ASC",
      ],
      ["createdAt", "DESC"],
    ],
  });

  for (const key in leaves) {
    if (leaves[key].request_type === FLOATING_LEAVE_TYPE) {
      attachFloatingLeaveType(leaves[key]);
      continue;
    }
    if (leaves[key].request_type === EXTRA_WORK_LEAVE_TYPE) {
      attachExtraWorkLeaveType(leaves[key]);
      continue;
    }
    const empLeave = await employeLeaveRepos.findOne({
      attributes: ["id", "leave_id", "leave_type"],
      where: {
        company_id,
        employee_id: leaves[key].employee_id,
        leave_id: leaves[key].leave_type_id,
      },
    });
    leaves[key].dataValues.leave_type = empLeave;
  }

  res.status(200).json({
    status: true,
    message: "Leaves fetched successfully",
    data: leaves,
  });
});

const createLeaveRequest = catchAsync(async (req, res, next) => {
  const { id: employee_id, company_id } = req.user;
  const {
    leave_type_id,
    start_date,
    end_date,
    total_days,
    leave_on = [],
    reason,
    emergency_contact_person,
    request_type = POLICY_LEAVE_TYPE,
    festival_name,
    festival_date,
    justification,
  } = req.body;
  const isFloatingLeave = request_type === FLOATING_LEAVE_TYPE;
  const isExtraWorkLeave = request_type === EXTRA_WORK_LEAVE_TYPE;

  let effectiveStartDate = start_date;
  let effectiveEndDate = end_date;
  let effectiveTotalDays = total_days;
  let effectiveLeaveOn = leave_on;
  let leave_type = isExtraWorkLeave ? EXTRA_WORK_LEAVE_LABEL : FLOATING_LEAVE_LABEL;

  if (isFloatingLeave) {
    const holiday = await validateFloatingLeaveRequest({
      leaveRequestRepos,
      company_id,
      employee_id,
      festival_name,
      festival_date,
      justification,
    });
    effectiveStartDate = holiday.date;
    effectiveEndDate = holiday.date;
    effectiveTotalDays = 1;
    effectiveLeaveOn = JSON.stringify([
      { date: holiday.date, type: 1, id: "Full Day", count: 1 },
    ]);
  }

  // Step 1: Parse dates
  const start = new Date(effectiveStartDate);
  const end = new Date(effectiveEndDate);

  // Step 2: Check valid date range
  if (start > end) {
    return next(
      new AppError(
        "Start date cannot be after end date",
        STATUS_CODE.BAD_REQUEST
      )
    );
  }

  // cant apply leave on same date if already applied check from db

  const leaveAppliedAlready = await leaveRequestRepos.findOne({
    where: {
      company_id,
      employee_id,
      status: "approved",
      ...(isFloatingLeave || isExtraWorkLeave ? {} : { leave_type_id }),
      [db.Sequelize.Op.or]: [
        { start_date: { [db.Sequelize.Op.between]: [start, end] } },
        { end_date: { [db.Sequelize.Op.between]: [start, end] } },
      ],
    },
  });

  if (leaveAppliedAlready) {
    return next(
      new AppError(
        "You have already applied leave on this date",
        STATUS_CODE.BAD_REQUEST
      )
    );
  }

  // Step 3: Calculate actual date difference (inclusive)
  const msPerDay = 1000 * 60 * 60 * 24;
  const calculatedDays = Math.floor((end - start) / msPerDay) + 1;

  // Step 4: Validate total_days against calculated date range
  if (effectiveTotalDays > calculatedDays) {
    return next(
      new AppError(
        `Total days (${effectiveTotalDays}) exceeds the date range (${calculatedDays} days)`,
        STATUS_CODE.BAD_REQUEST
      )
    );
  }

  if (isExtraWorkLeave) {
    try {
      await validateExtraWorkLeaveAvailability({
        extraWorkLeaveBalanceRepos,
        leaveRequestRepos,
        company_id,
        employee_id,
        total_days: effectiveTotalDays,
      });
    } catch (error) {
      return next(error);
    }
  }

  if (!isFloatingLeave && !isExtraWorkLeave) {
    const leave = await employeLeaveRepos.findOne({
      attributes: [
        "id",
        "leave_count",
        "leave_type",
        "leave_remaing",
        "leave_used",
      ],
      where: {
        company_id,
        employee_id,
        leave_id: leave_type_id,
      },
    });
    if (!leave) {
      return next(new AppError("Leave does not found", STATUS_CODE.NOT_FOUND));
    }
    leave_type = leave.leave_type;
  }

  // Step 7: Create leave request (uncomment and customize as needed)
  const transaction = await db.sequelize.transaction();
  try {
    await leaveRequestRepos.create(
      {
        employee_id,
        company_id,
        leave_type_id: isFloatingLeave || isExtraWorkLeave ? null : leave_type_id,
        request_type,
        festival_name: isFloatingLeave ? festival_name : null,
        festival_date: isFloatingLeave ? formatDateOnly(festival_date) : null,
        justification: isFloatingLeave ? justification : null,
        start_date: effectiveStartDate,
        end_date: effectiveEndDate,
        total_days: effectiveTotalDays,
        leave_on: effectiveLeaveOn,
        reason,
        emergency_contact_person,
        status: "pending",
      },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    return next(new AppError(error, STATUS_CODE.INTERNAL_SERVER_ERROR));
  }

  //   notify to admin with [email,notification]
  eventEmitter.emit(eventObj.LEAVE_REQUEST, {
    employee_id,
    company_id,
    leave_type,
    start_date: effectiveStartDate,
    end_date: effectiveEndDate,
    total_days: effectiveTotalDays,
    leave_on: effectiveLeaveOn,
    reason,
  });

  const employee = await employeeRepos.findOne({
    attributes: ["first_name"],
    where: {
      company_id,
      id: employee_id,
    },
  });
  const { first_name = "unkown" } = employee;

  // history
  await activityRepos.addActivity({
    company_id,
    employee_id,
    title: `${first_name} has requested new ${leave_type}`,
    message: "Leave requested applied successfully",
    role: "employee",
  });

  res.status(200).json({
    status: true,
    message: "Leave requested applied successfully",
    data: null,
  });
});

// cancel leave request
const cancelLeaveRequest = catchAsync(async (req, res, next) => {
  const { emitToUser } = require("../../config/initsocket");
  const { id: employee_id, company_id } = req.user;
  const { leave_request_id } = req.params;

  const leave = await leaveRequestRepos.findOne({
    where: { id: leave_request_id, employee_id, company_id },
  });
  if (!leave) {
    return next(new AppError("Leave request not found", STATUS_CODE.NOT_FOUND));
  }

  if (!["pending"].includes(leave?.status)) {
    return next(new AppError("Leave request not found", STATUS_CODE.NOT_FOUND));
  }

  // get admin
  const usersAdmin = await userRepos.findAll({
    where: {
      company_id,
      role: "admin",
    },
  });
  for (const user of usersAdmin) {
    const notifyToAdmin = `admin_${user.id}`;
    await emitToUser(notifyToAdmin, "notify:user", {});
  }
  // remove
  await leave.destroy();
  res.status(200).json({
    status: true,
    message: "Leave request cancelled successfully",
    data: null,
  });
});

module.exports = {
  getAllLeave,
  getAllLeaveRequest,
  createLeaveRequest,
  cancelLeaveRequest,
};
