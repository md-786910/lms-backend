const { STATUS_CODE } = require("../../constants/statusCode");
const eventEmitter = require("../../events/eventEmitter");
const eventObj = require("../../events/events");
const db = require("../../models");
const {
  employeLeaveRepos,
  leaveRequestRepos,
  activityRepos,
} = require("../../repository/base");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const getAllLeave = catchAsync(async (req, res, next) => {
  const { id, company_id } = req.user;
  const leaves = await employeLeaveRepos.findAll({
    where: { employee_id: id, company_id },
  });
  let total_approved = await leaveRequestRepos.findAll({
    where: {
      company_id,
      employee_id: id,
      status: "approved",
    },
  });
  let total_pending = await leaveRequestRepos.findAll({
    where: {
      company_id,
      employee_id: id,
      status: "pending",
    },
  });

  // sumation for total remaining days inclusing all leave use reduce
  const total_remaining = leaves?.reduce((sum, leave) => {
    return sum + leave?.leave_remaing;
  }, 0);

  total_approved = total_approved?.reduce((sum, leave) => {
    return sum + leave?.total_days;
  }, 0);

  total_pending = total_pending?.reduce((sum, leave) => {
    return sum + leave?.total_days;
  }, 0);

  res.status(200).json({
    status: true,
    message: "Leaves fetched successfully",
    data: {
      leaves,
      total_approved,
      total_pending,
      total_remaining,
    },
  });
});

const getAllLeaveRequest = catchAsync(async (req, res, next) => {
  const { id, company_id } = req.user;
  const leaves = await leaveRequestRepos.findAll({
    where: { employee_id: id, company_id },
    include: [
      {
        attributes: ["id", "leave_type"],
        model: employeLeaveRepos,
        as: "leave_type",
      },
    ],
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
    attributes: ["id", "leave_count", "leave_type", "leave_remaing"],
    where: {
      company_id,
      employee_id,
      id: leave_type_id,
    },
  });
  if (!leave) {
    return next(new AppError("Leave does not found", STATUS_CODE.NOT_FOUND));
  }
  const { leave_count, leave_remaing, leave_type } = leave;
  if (total_days > leave_remaing) {
    return next(
      new AppError(
        `You can't apply more than ${leave_remaing} days of ${leave_type} leave`,
        STATUS_CODE.BAD_REQUEST
      )
    );
  }

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

  // history
  await activityRepos.addActivity({
    company_id,
    employee_id,
    title: `New ${leave_type} request applied`,
    message: "Leave request applied successfully",
    role: "employee",
  });

  res.status(200).json({
    status: true,
    message: "Leave request applied successfully",
    data: null,
  });
});

// cancel leave request
const cancelLeaveRequest = catchAsync(async (req, res, next) => {
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

  await activityRepos.addActivity({
    company_id,
    employee_id,
    title: `Leave request cancelled`,
    message: "Leave request cancelled successfully",
    role: "employee",
  });
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
