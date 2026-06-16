const {
  leaveRequestRepos,
  employeeRepos,
  employeLeaveRepos,
  employeeLeaveMonthlySummaryRepos,
  prefixRepos,
  activityRepos,
} = require("../repository/base");
const catchAsync = require("../utils/catchAsync");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const AppError = require("../utils/appError");
const { STATUS_CODE } = require("../constants/statusCode");
const { Sequelize } = require("../models");
const eventEmitter = require("../events/eventEmitter");
const eventObj = require("../events/events");
const db = require("../models");
const {
  MONTH_NAMES,
  buildLeaveMonthlySummaryRecords,
  getYearRangeWhere,
  recomputeEmployeeLeaveBalance,
  recomputeEmployeeYearlyLeaveSummaryRecords,
  syncLeaveMonthlySummaryRecords,
} = require("../utils/leaveCarryForward");

const getAllEmployeLeavs = catchAsync(async (req, res, next) => {
  const query = req.query;
  if (!query) {
    return next(new AppError("query not found", STATUS_CODE.NOT_FOUND));
  }
  const {
    search = "",
    status = "all",
    leave_type_id = 0,
    employee_id,
  } = query;
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
  if (employee_id) {
    const parsedEmployeeId = parseInt(employee_id, 10);
    if (!Number.isNaN(parsedEmployeeId)) {
      where.employee_id = parsedEmployeeId;
    }
  }

  console.log({ leave_type_id });

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
  console.log({ where });
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

    const empLeave = await employeLeaveRepos.findOne({
      attributes: ["id", "leave_type"],
      where: {
        company_id,
        employee_id: leaves[key].employee_id,
        leave_id: leaves[key].leave_type_id,
      },
    });
    leaves[key].dataValues.leave_type = empLeave;

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
    title: `${first_name} your leave request has been rejected`,
    message: `${first_name} Leave request rejected has been successfully`,
    role: "employee",
  });

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
      leave_id: leave?.leave_type_id,
    },
  });
  if (!checkLeaveAvailable) {
    return next(new AppError("Leave type not found", STATUS_CODE.NOT_FOUND));
  }

  const transaction = await db.sequelize.transaction();
  try {
    leave.status = "approved";
    await leave.save({ transaction });
    await recomputeEmployeeLeaveBalance({
      company_id,
      employee_id,
      leave_id: leave.leave_type_id,
      employeLeaveRepos,
      leaveRequestRepos,
      transaction,
    });
    await recomputeEmployeeYearlyLeaveSummaryRecords({
      company_id,
      employee_id,
      leave_id: leave.leave_type_id,
      year: new Date(leave.start_date).getFullYear(),
      employeeRepos,
      employeLeaveRepos,
      leaveRequestRepos,
      employeeLeaveMonthlySummaryRepos,
      transaction,
    });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    return next(
      new AppError(
        error.message || "Error approving leave request",
        STATUS_CODE.INTERNAL_SERVER_ERROR
      )
    );
  }

  // get employee first name
  const employee = await employeeRepos.findOne({
    attributes: ["first_name"],
    where: {
      company_id,
      id: employee_id,
    },
  });
  console.log({ employee });
  const { first_name = "unkown" } = employee;

  await activityRepos.addActivity({
    company_id,
    employee_id,
    title: `${first_name} your leave request has been approved`,
    message: `${first_name} your leave request has been approved`,
    role: "employee",
  });
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

// Admin create leave for employee
const adminCreateLeaveRequest = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const {
    employee_id,
    leave_type_id,
    start_date,
    end_date,
    total_days,
    leave_on = [],
    reason,
    emergency_contact_person,
    status = "approved", // Admin can set status directly (approved or pending)
  } = req.body;

  // Validate employee exists in the company
  const employee = await employeeRepos.findOne({
    where: { id: employee_id, company_id },
    attributes: ["id", "first_name"],
  });

  if (!employee) {
    return next(
      new AppError("Employee not found in this company", STATUS_CODE.NOT_FOUND)
    );
  }

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

  // Step 3: Check if leave already applied on same dates
  const leaveAppliedAlready = await leaveRequestRepos.findOne({
    where: {
      company_id,
      employee_id,
      leave_type_id,
      [Op.or]: [
        { start_date: { [Op.between]: [start, end] } },
        { end_date: { [Op.between]: [start, end] } },
      ],
    },
  });

  if (leaveAppliedAlready) {
    return next(
      new AppError(
        "This employee already has an approved leave for the selected date.",
        STATUS_CODE.BAD_REQUEST
      )
    );
  }

  // Step 4: Validate leave type exists
  const leaveType = await employeLeaveRepos.findOne({
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

  if (!leaveType) {
    return next(
      new AppError(
        "Leave type not found for this employee",
        STATUS_CODE.NOT_FOUND
      )
    );
  }

  // Step 5: Validate total days
  const msPerDay = 1000 * 60 * 60 * 24;
  const calculatedDays = Math.floor((end - start) / msPerDay) + 1;

  if (Number(total_days) > calculatedDays) {
    return next(
      new AppError(
        `Total days (${total_days}) exceeds the date range (${calculatedDays} days)`,
        STATUS_CODE.BAD_REQUEST
      )
    );
  }

  // Step 6: Create leave request in transaction
  const transaction = await db.sequelize.transaction();
  try {
    const leaveRequest = await leaveRequestRepos.create(
      {
        employee_id,
        company_id,
        leave_type_id,
        start_date,
        end_date,
        total_days,
        leave_on,
        reason,
        emergency_contact_person,
        status,
      },
      { transaction }
    );

    // Step 8: If status is approved, update leave balance
    if (status === "approved") {
      await recomputeEmployeeLeaveBalance({
        company_id,
        employee_id,
        leave_id: leave_type_id,
        employeLeaveRepos,
        leaveRequestRepos,
        transaction,
      });
      await recomputeEmployeeYearlyLeaveSummaryRecords({
        company_id,
        employee_id,
        leave_id: leave_type_id,
        year: new Date(start_date).getFullYear(),
        employeeRepos,
        employeLeaveRepos,
        leaveRequestRepos,
        employeeLeaveMonthlySummaryRepos,
        transaction,
      });

      // Add activity log
      await activityRepos.addActivity({
        company_id,
        employee_id,
        title: `Admin created approved leave for ${employee.first_name}`,
        message: `${employee.first_name}'s leave has been approved by admin`,
        role: "employee",
      });

      // Emit approval event
      eventEmitter.emit(eventObj.APPROVED_LEAVE, {
        employee_id,
        company_id,
        leave_request_id: leaveRequest.id,
        leave_type: leaveType.leave_type,
      });
    } else {
      // Add activity log for pending
      await activityRepos.addActivity({
        company_id,
        employee_id,
        title: `Admin created leave request for ${employee.first_name}`,
        message: `Admin has created a leave request for ${employee.first_name}`,
        role: "employee",
      });
    }

    await transaction.commit();

    res.status(201).json({
      status: true,
      message: `Leave request created successfully with status: ${status}`,
      data: leaveRequest,
    });
  } catch (error) {
    await transaction.rollback();
    return next(
      new AppError(
        error.message || "Error creating leave request",
        STATUS_CODE.INTERNAL_SERVER_ERROR
      )
    );
  }
});

// Get yearly leave summary by employee and month
const getYearlyLeaveSummary = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const { year = new Date().getFullYear(), month, employee_id } = req.query;
  const parsedYear = parseInt(year, 10);
  const parsedEmployeeId = employee_id ? parseInt(employee_id, 10) : null;

  let whereClause = {
    company_id,
    status: "approved",
    ...getYearRangeWhere(parsedYear),
  };

  if (parsedEmployeeId) {
    whereClause.employee_id = parsedEmployeeId;
  }

  const leaveRequests = await leaveRequestRepos.findAll({
    where: whereClause,
    order: [["start_date", "ASC"]],
  });

  let employeeWhere = { company_id, is_suspended: false };
  if (parsedEmployeeId) {
    employeeWhere.id = parsedEmployeeId;
  }

  const employees = await employeeRepos.findAll({
    where: employeeWhere,
    attributes: ["id", "first_name", "last_name", "department_id"],
    order: [["first_name", "ASC"]],
  });

  const employeeLeaves = await employeLeaveRepos.findAll({
    where: {
      company_id,
      ...(parsedEmployeeId && { employee_id: parsedEmployeeId }),
    },
  });

  const departmentIds = [...new Set(employees.map((emp) => emp.department_id).filter(Boolean))];
  const prefixes = await prefixRepos.findAll({
    attributes: ["id", "name"],
    where: { id: { [Op.in]: departmentIds } },
  });
  const prefixByDepartment = prefixes.reduce((acc, prefix) => {
    acc[prefix.id] = prefix.name;
    return acc;
  }, {});

  const { summaries: result, records } = buildLeaveMonthlySummaryRecords({
    employees,
    employeeLeaves,
    leaveRequests,
    year: parsedYear,
    prefixByDepartment,
  });

  await syncLeaveMonthlySummaryRecords({
    employeeLeaveMonthlySummaryRepos,
    records,
  });

  result.sort((a, b) => a.name.localeCompare(b.name));

  const employeeOptions = employees.map((e) => ({
    id: e.id,
    name: `${e.first_name} ${e.last_name || ""}`.trim(),
  }));

  if (month) {
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = MONTH_NAMES[monthIndex];
    const monthStart = new Date(parsedYear, monthIndex, 1);
    const monthEnd = new Date(parsedYear, monthIndex + 1, 0, 23, 59, 59, 999);

    const detailedLeaves = await leaveRequestRepos.findAll({
      where: {
        company_id,
        status: "approved",
        ...(parsedEmployeeId && { employee_id: parsedEmployeeId }),
        [Op.or]: [
          { start_date: { [Op.between]: [monthStart, monthEnd] } },
          { end_date: { [Op.between]: [monthStart, monthEnd] } },
          {
            [Op.and]: [
              { start_date: { [Op.lte]: monthStart } },
              { end_date: { [Op.gte]: monthEnd } },
            ],
          },
        ],
      },
      include: [
        {
          attributes: ["id", "first_name", "last_name", "department_id"],
          model: employeeRepos,
          as: "employee",
        },
      ],
      order: [["start_date", "ASC"]],
    });

    return res.status(200).json({
      status: true,
      message: "Monthly leave details fetched successfully",
      data: {
        summary: result.filter(
          (emp) => emp[monthName] > 0 || emp[`${monthName}_deduction`] > 0
        ),
        details: detailedLeaves,
        month: monthName,
        year: parsedYear,
        employees: employeeOptions,
      },
    });
  }

  res.status(200).json({
    status: true,
    message: "Yearly leave summary fetched successfully",
    data: {
      summary: result,
      year: parsedYear,
      employees: employeeOptions,
    },
  });
});

module.exports = {
  getAllEmployeLeavs,
  employeLeaveReject,
  employeLeaveApprove,
  getLeaveDashboard,
  adminCreateLeaveRequest,
  getYearlyLeaveSummary,
};
