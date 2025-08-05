const {
  leaveRequestRepos,
  employeeRepos,
  employeLeaveRepos,
  prefixRepos,
} = require("../repository/base");
const catchAsync = require("../utils/catchAsync");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const AppError = require("../utils/appError");
const { STATUS_CODE } = require("../constants/statusCode");
const { Sequelize } = require("../models");
const eventEmitter = require("../events/eventEmitter");
const eventObj = require("../events/events");

const getAllEmployeLeavs = catchAsync(async (req, res, next) => {
  const query = req.query;
  if (!query) {
    return next(new AppError("query not found", STATUS_CODE.NOT_FOUND));
  }
  const { search = "", status = "all", leave_type_id = 0 } = query;
  const { company_id } = req.user;
  let where = {
    company_id,
  };
  if (parseInt(leave_type_id) && parseInt(leave_type_id) !== 0) {
    where.leave_type_id = parseInt(leave_type_id);
  }
  if (status && status !== "all") {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      {
        "$employee.first_name$": {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        "$leave_type.leave_type$": {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  const leaves = await leaveRequestRepos.findAll({
    where,
    include: [
      {
        attributes: [
          "id",
          "first_name",
          "last_name",
          "employee_no",
          "department_id",
        ],
        model: employeeRepos,
        as: "employee",
      },
      {
        attributes: ["id", "leave_type"],
        model: employeLeaveRepos,
        as: "leave_type",
      },
    ],
    order: [
      [
        Sequelize.literal(`
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
    const prefix = await prefixRepos.findOne({
      attributes: ["name"],
      where: {
        id: leaves[key].employee.department_id,
      },
    });
    const pref = prefix?.name ?? "EMP";
    leaves[key].employee.employee_no = `${pref}-${leaves[key].employee?.id}`;
  }

  res.status(200).json({
    status: true,
    message: "Leaves fetched successfully",
    data: leaves,
  });
});

const employeLeaveReject = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const { id, employee_id } = req.params;
  if (!id || id == undefined || !employee_id || employee_id === undefined) {
    return next(new AppError("Leave type id not found", STATUS_CODE.NOT_FOUND));
  }
  const leave = await leaveRequestRepos.findOne({
    where: { company_id, employee_id, id, status: "pending" },
  });
  if (!leave) {
    return next(new AppError("Leave request not found", STATUS_CODE.NOT_FOUND));
  }
  const { rejected_reason } = req.body;
  leave.status = "rejected";
  leave.rejected_reason = rejected_reason;
  await leave.save();

  //   notify to employ with [email,notification]
  eventEmitter.emit(eventObj.REJECTED_LEAVE, {
    employee_id,
    company_id,
    leave_request_id: id,
  });
  res.status(200).json({
    status: true,
    message: "Leave rejected successfully",
  });
});

const employeLeaveApprove = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const { id, employee_id } = req.params;
  if (!id || id == undefined || !employee_id || employee_id === undefined) {
    return next(new AppError("Leave type id not found", STATUS_CODE.NOT_FOUND));
  }
  const leave = await leaveRequestRepos.findOne({
    where: { company_id, employee_id, id, status: "pending" },
  });

  if (!leave) {
    return next(new AppError("Leave request not found", STATUS_CODE.NOT_FOUND));
  }

  // check leave available to corresponding type and update it
  const checkLeaveAvailable = await employeLeaveRepos.findOne({
    where: {
      company_id,
      employee_id,
      id: leave?.leave_type_id,
    },
  });
  if (!checkLeaveAvailable) {
    return next(new AppError("Leave type not found", STATUS_CODE.NOT_FOUND));
  }
  checkLeaveAvailable.leave_remaing =
    checkLeaveAvailable.leave_count - parseFloat(leave.total_days || 0);
  checkLeaveAvailable.leave_used =
    checkLeaveAvailable.leave_used + parseFloat(leave.total_days || 0);
  await checkLeaveAvailable.save();

  leave.status = "approved";
  await leave.save();

  //   notify to employ with [email,notification]
  eventEmitter.emit(eventObj.APPROVED_LEAVE, {
    employee_id,
    company_id,
    leave_request_id: id,
    leave_type: checkLeaveAvailable.leave_type,
  });

  res.status(200).json({
    status: true,
    message: "Leave approved successfully",
    data: null,
  });
});

// getDashboard
const getLeaveDashboard = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;

  const now = dayjs();
  const startOfMonth = now.startOf("month").toDate();
  const endOfMonth = now.endOf("month").toDate();

  // 1. Fetch pending requests
  const pendingRequests = await leaveRequestRepos.count({
    where: { company_id, status: "pending" },
  });

  // 2. Fetch approved requests
  const approvedRequests = await leaveRequestRepos.findAll({
    where: { company_id, status: "approved" },
    attributes: ["total_days", "start_date", "end_date"],
  });
  const approvedCount = approvedRequests.length;
  // 3. Calculate total leave days from approved
  const totalLeaveDays = approvedRequests.reduce(
    (sum, r) => sum + (parseInt(r.total_days) || 0),
    0
  );

  // 4. Calculate leave days for this month only
  const thisMonthLeaveDays = approvedRequests.reduce((sum, r) => {
    const start = new Date(r.start_date);
    const end = new Date(r.end_date);

    // If the leave overlaps with the current month
    if (start <= endOfMonth && end >= startOfMonth) {
      sum += parseInt(r.total_days) || 0;
    }

    return sum;
  }, 0);

  res.status(200).json({
    status: true,
    message: "Dashboard data fetched successfully",
    data: {
      pending_requests: pendingRequests,
      approved_requests: approvedCount,
      total_leave_days: totalLeaveDays,
      this_month: thisMonthLeaveDays,
    },
  });
});

module.exports = {
  getAllEmployeLeavs,
  employeLeaveReject,
  employeLeaveApprove,
  getLeaveDashboard,
};
