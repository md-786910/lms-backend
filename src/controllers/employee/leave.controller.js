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
} = require("../../repository/base");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

const roundLeave = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

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

  const approvedCycleRequests = await leaveRequestRepos.findAll({
    where: {
      company_id,
      employee_id: id,
      status: "approved",
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

  const cycleUsedByLeaveId = approvedCycleRequests.reduce((acc, leave) => {
    const leaveTypeId = Number(leave.leave_type_id);
    acc[leaveTypeId] =
      (acc[leaveTypeId] || 0) + getLeaveDaysInsideRange(leave, cycleInfo);
    return acc;
  }, {});

  const cycleLeaves = leaves.map((leave) => {
    const cycleLeaveCount = roundLeave(Number(leave.leave_count || 0) / 2);
    const cycleLeaveUsed = roundLeave(cycleUsedByLeaveId[leave.leave_id] || 0);
    const cycleLeaveRemaining = roundLeave(
      Math.max(0, cycleLeaveCount - cycleLeaveUsed)
    );

    leave.dataValues.cycle_leave_count = cycleLeaveCount;
    leave.dataValues.cycle_leave_used = cycleLeaveUsed;
    leave.dataValues.cycle_leave_remaining = cycleLeaveRemaining;
    leave.dataValues.cycle = cycleInfo.cycle;
    leave.dataValues.cycle_label = cycleInfo.cycle_label;
    leave.dataValues.cycle_name = cycleInfo.cycle_name;

    return leave;
  });

  const cycle_total = cycleLeaves.reduce((sum, leave) => {
    return sum + Number(leave.dataValues.cycle_leave_count || 0);
  }, 0);
  const cycle_used = cycleLeaves.reduce((sum, leave) => {
    return sum + Number(leave.dataValues.cycle_leave_used || 0);
  }, 0);
  const cycle_remaining = cycleLeaves.reduce((sum, leave) => {
    return sum + Number(leave.dataValues.cycle_leave_remaining || 0);
  }, 0);

  let total_pending = await leaveRequestRepos.findAll({
    where: {
      company_id,
      employee_id: id,
      status: "pending",
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

  res.status(200).json({
    status: true,
    message: "Leaves fetched successfully",
    data: {
      cycle: cycleInfo.cycle,
      cycle_label: cycleInfo.cycle_label,
      cycle_name: cycleInfo.cycle_name,
      cycle_start_month: cycleInfo.cycle_start_month,
      cycle_end_month: cycleInfo.cycle_end_month,
      cycle_total: roundLeave(cycle_total),
      cycle_used: roundLeave(cycle_used),
      cycle_remaining: roundLeave(cycle_remaining),
      leaves: cycleLeaves,
      total_approved: roundLeave(cycle_used),
      total_pending: roundLeave(total_pending),
      total_remaining: roundLeave(cycle_remaining),
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
  } = req.body;

  // Step 1: Parse dates
  const start = new Date(start_date);
  const end = new Date(end_date);

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
      leave_type_id,
      status: "approved",
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
  if (total_days > calculatedDays) {
    return next(
      new AppError(
        `Total days (${total_days}) exceeds the date range (${calculatedDays} days)`,
        STATUS_CODE.BAD_REQUEST
      )
    );
  }

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
  const { leave_type } = leave;

  // Step 7: Create leave request (uncomment and customize as needed)
  const transaction = await db.sequelize.transaction();
  try {
    await leaveRequestRepos.create(
      {
        employee_id,
        company_id,
        leave_type_id,
        start_date,
        end_date,
        total_days,
        leave_on, // optional JSONB field
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
    start_date,
    end_date,
    total_days,
    leave_on,
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
