const {
  leaveRequestRepos,
  employeeRepos,
  leaveRepos,
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
const { normalizePolicy } = require("../services/leavePolicyService");

const roundLeave = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const parseLeaveOn = (leaveOn) => {
  if (!leaveOn) return [];
  if (Array.isArray(leaveOn)) return leaveOn;
  try {
    return JSON.parse(leaveOn);
  } catch (error) {
    return [];
  }
};

const createEmptyMonthlyLeaveTotals = (monthNames) =>
  monthNames.reduce((acc, monthName) => {
    acc[monthName] = {
      availed: 0,
      deduction: 0,
    };
    return acc;
  }, {});

const buildCycleStartDate = (year, monthIndex, resetCycleMonths = 6) => {
  const cycleMonths = Math.max(1, Math.min(Number(resetCycleMonths || 6), 12));
  const cycleStartMonth = Math.floor(monthIndex / cycleMonths) * cycleMonths;
  return new Date(Number(year), cycleStartMonth, 1, 0, 0, 0, 0);
};

const getMonthlyAccruedLeave = (policy, year, monthIndex) => {
  const cycleStart = buildCycleStartDate(year, monthIndex, policy.resetCycleMonths);
  const monthsAccrued =
    (Number(year) - cycleStart.getFullYear()) * 12 +
    (monthIndex - cycleStart.getMonth()) +
    1;
  const cycleEntitlement = roundLeave(
    (Number(policy.totalEntitlement || 0) / 12) *
      Math.max(1, Math.min(Number(policy.resetCycleMonths || 6), 12))
  );

  return roundLeave(
    Math.min(
      Math.max(0, monthsAccrued) * Number(policy.monthlyAccrual || 0),
      cycleEntitlement
    )
  );
};

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
        "$policy.type$": {
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
      {
        attributes: ["id", "type"],
        model: leaveRepos,
        as: "policy",
        required: false,
      },
    ],
    order: [
      [
        Sequelize.literal(`
        CASE
          WHEN "LeaveRequest"."status" = 'pending' THEN 1
          WHEN "LeaveRequest"."status" = 'approved' THEN 2
          WHEN "LeaveRequest"."status" = 'rejected' THEN 3
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

    const leaveType = await leaveRepos.findOne({
      attributes: ["id", "type"],
      where: {
        company_id,
        id: leaves[key].leave_type_id,
      },
    });
    leaves[key].dataValues.leave_type = leaveType
      ? {
          id: leaveType.id,
          leave_id: leaveType.id,
          leave_type: leaveType.type,
        }
      : null;

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

  const checkLeaveAvailable = await leaveRepos.findOne({
    where: {
      company_id,
      id: leave?.leave_type_id,
      status: "active",
    },
  });
  if (!checkLeaveAvailable) {
    return next(new AppError("Leave type not found", STATUS_CODE.NOT_FOUND));
  }

  leave.status = "approved";
  await leave.save();

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
    leave_type: checkLeaveAvailable.type,
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
  const leaveType = await leaveRepos.findOne({
    attributes: ["id", "type", "status"],
    where: {
      company_id,
      id: leave_type_id,
      status: "active",
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
        leave_type: leaveType.type,
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

// Static leave data for 2025
const STATIC_LEAVE_DATA_2025 = [
  {
    name: "Md Ashif Reza",
    january: 1,
    february: 2,
    march: 0,
    april: 1.5,
    may: 0,
    june: 1,
    july: 2,
    august: 0,
    september: 3,
    october: 0,
    november: 3,
    december: 0,
    total: 13.5,
  },
  {
    name: "Amir sohail",
    january: 0,
    february: 0,
    march: 0,
    april: 1,
    may: 0,
    june: 0,
    july: 0,
    august: 2,
    september: 1,
    october: 1,
    november: 4,
    december: 0,
    total: 9,
  },
  {
    name: "Saddam Hussain",
    january: 0,
    february: 0,
    march: 1,
    april: 0,
    may: 1,
    june: 0,
    july: 2,
    august: 0,
    september: 1,
    october: 0,
    november: 2,
    december: 0,
    total: 7,
  },
  {
    name: "Vaibhav",
    january: 1.5,
    february: 0,
    march: 0,
    april: 0,
    may: 0.5,
    june: 0,
    july: 0.5,
    august: 1,
    september: 1,
    october: 2.5,
    november: 1.5,
    december: 0,
    total: 8.5,
  },
  {
    name: "Rahul",
    january: 1.5,
    february: 1,
    march: 0,
    april: 0,
    may: 0,
    june: 0,
    july: 0.5,
    august: 2,
    september: 0,
    october: 1,
    november: 1,
    december: 0,
    total: 7,
  },
  {
    name: "Mohd Qasim",
    january: 1,
    february: 1,
    march: 0,
    april: 1,
    may: 0,
    june: 1,
    july: 3,
    august: 1,
    september: 2,
    october: 0,
    november: 0,
    december: 0,
    total: 10,
  },
  {
    name: "Adil Saifi",
    january: 1,
    february: 1.5,
    march: 1.5,
    april: 2,
    may: 1,
    june: 4,
    july: 1,
    august: 3,
    september: 1,
    october: 2,
    november: 2.5,
    december: 0,
    total: 20.5,
  },
  {
    name: "Amit Singh",
    january: 1.5,
    february: 0,
    march: 0,
    april: 0,
    may: 0,
    june: 0,
    july: 1,
    august: 0,
    september: 0,
    october: 1,
    november: 1,
    december: 0,
    total: 4.5,
  },
  {
    name: "Satyanand",
    january: 0,
    february: 1,
    march: 1,
    april: 1,
    may: 2,
    june: 4.5,
    july: 0,
    august: 1,
    september: 1,
    october: 2,
    november: 1.5,
    december: 0,
    total: 15,
  },
  {
    name: "Sunil kumar singh",
    january: 0,
    february: 0,
    march: 0,
    april: 0,
    may: 0,
    june: 0,
    july: 0,
    august: 0,
    september: 0,
    october: 0,
    november: 0,
    december: 0,
    total: 0,
  },
];

// Get yearly leave summary by employee and month
const getYearlyLeaveSummary = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const { year = new Date().getFullYear(), month, employee_id } = req.query;

  const monthNames = [
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

  // Return static data for 2025
  if (parseInt(year) === 2025) {
    let result = STATIC_LEAVE_DATA_2025.map((emp, index) => ({
      ...emp,
      employee_id: index + 1,
      monthly: monthNames.reduce((acc, monthName) => {
        acc[monthName] = {
          availed: Number(emp[monthName] || 0),
          deduction: 0,
        };
        return acc;
      }, {}),
      total_availed: Number(emp.total || 0),
      total_deduction: 0,
    }));

    // Filter by employee name if provided
    if (employee_id) {
      result = result.filter(
        (emp) => emp.employee_id === parseInt(employee_id)
      );
    }

    // sort based on asc
    result.sort((a, b) => a.name.localeCompare(b.name));

    // Filter by month if specified
    if (month) {
      const monthIndex = parseInt(month) - 1;
      const monthName = monthNames[monthIndex];
      return res.status(200).json({
        status: true,
        message: "Monthly leave details fetched successfully",
        data: {
          summary: result.filter((emp) => emp.monthly?.[monthName]?.availed > 0),
          details: [],
          month: monthName,
          year: 2025,
        },
      });
    }

    return res.status(200).json({
      status: true,
      message: "Yearly leave summary fetched successfully",
      data: {
        summary: result,
        year: 2025,
        employees: STATIC_LEAVE_DATA_2025.map((e, index) => ({
          id: index + 1,
          name: e.name,
        })),
      },
    });
  }

  // For other years, use database
  const startOfYear = new Date(`${year}-01-01`);
  const endOfYear = new Date(`${year}-12-31`);

  // Build where clause for leave requests
  let whereClause = {
    company_id,
    status: "approved",
    [Op.or]: [
      {
        start_date: {
          [Op.between]: [startOfYear, endOfYear],
        },
      },
      {
        end_date: {
          [Op.between]: [startOfYear, endOfYear],
        },
      },
    ],
  };

  // Filter by employee if provided
  if (employee_id) {
    whereClause.employee_id = parseInt(employee_id);
  }

  // Get all approved leave requests for the year
  const leaveRequests = await leaveRequestRepos.findAll({
    where: whereClause,
    include: [
      {
        attributes: ["id", "first_name", "last_name", "department_id"],
        model: employeeRepos,
        as: "employee",
      },
      {
        attributes: [
          "id",
          "type",
          "annual_days",
          "monthlyAccrual",
          "resetCycleMonths",
          "carryForwardEnabled",
          "salaryDeductionEnabled",
          "status",
        ],
        model: leaveRepos,
        as: "policy",
      },
    ],
    order: [["start_date", "ASC"]],
  });

  // Get all employees for the company (to show even those with 0 leaves)
  let employeeWhere = { company_id, is_suspended: false };
  if (employee_id) {
    employeeWhere.id = parseInt(employee_id);
  }

  const employees = await employeeRepos.findAll({
    where: employeeWhere,
    attributes: ["id", "first_name", "last_name", "department_id"],
    order: [["first_name", "ASC"]],
  });

  // Initialize summary structure for each employee
  const employeeSummary = {};
  // Initialize each employee with zero leaves for all months
  for (const emp of employees) {
    const prefix = await prefixRepos.findOne({
      attributes: ["name"],
      where: { id: emp.department_id },
    });
    const pref = prefix?.name ?? "EMP";

    employeeSummary[emp.id] = {
      employee_id: emp.id,
      name: `${emp.first_name} ${emp.last_name || ""}`.trim().toUpperCase(),
      employee_no: `${pref}-${emp.id}`,
      monthly: createEmptyMonthlyLeaveTotals(monthNames),
      leave_types: {},
      january: 0,
      february: 0,
      march: 0,
      april: 0,
      may: 0,
      june: 0,
      july: 0,
      august: 0,
      september: 0,
      october: 0,
      november: 0,
      december: 0,
      total: 0,
      total_availed: 0,
      total_deduction: 0,
    };
  }

  const leaveUsageByEmployeeAndPolicy = {};

  for (const leave of leaveRequests) {
    const empId = leave.employee_id;
    if (!employeeSummary[empId]) continue;

    const policy = normalizePolicy(leave.policy);
    const leaveTypeId = leave.leave_type_id || policy.id || "unknown";
    const usageKey = `${empId}-${leaveTypeId}`;
    if (!leaveUsageByEmployeeAndPolicy[usageKey]) {
      leaveUsageByEmployeeAndPolicy[usageKey] = {
        policy,
        monthly: Array.from({ length: 12 }, () => 0),
      };
    }

    if (!employeeSummary[empId].leave_types[leaveTypeId]) {
      employeeSummary[empId].leave_types[leaveTypeId] = {
        id: leaveTypeId,
        name: policy.leaveType || leave.policy?.type || "Leave",
        monthly: createEmptyMonthlyLeaveTotals(monthNames),
        total_availed: 0,
        total_deduction: 0,
      };
    }

    const leaveOn = parseLeaveOn(leave.leave_on);
    if (leaveOn.length > 0) {
      for (const day of leaveOn) {
        const dayDate = new Date(day.date);
        if (dayDate.getFullYear() === parseInt(year)) {
          const monthIndex = dayDate.getMonth();
          const dayValue = Number(day?.count ?? (day.day === "full" ? 1 : 0.5));
          leaveUsageByEmployeeAndPolicy[usageKey].monthly[monthIndex] += dayValue;
        }
      }
    } else {
      const totalDays = parseFloat(leave.total_days) || 0;
      const startDate = new Date(leave.start_date);
      const startMonth = startDate.getMonth();
      if (startDate.getFullYear() === parseInt(year)) {
        leaveUsageByEmployeeAndPolicy[usageKey].monthly[startMonth] += totalDays;
      }
    }
  }

  Object.entries(leaveUsageByEmployeeAndPolicy).forEach(([usageKey, usage]) => {
    const [empId, leaveTypeId] = usageKey.split("-");
    const employee = employeeSummary[empId];
    if (!employee) return;

    const typeSummary = employee.leave_types[leaveTypeId];
    let cycleUsed = 0;

    usage.monthly.forEach((availedRaw, monthIndex) => {
      const availed = roundLeave(availedRaw);
      const monthName = monthNames[monthIndex];
      const policy = usage.policy;
      const cycleStart = buildCycleStartDate(
        year,
        monthIndex,
        policy.resetCycleMonths
      );

      if (monthIndex === cycleStart.getMonth()) {
        cycleUsed = 0;
      }

      const availableBeforeMonth = policy.carryForwardEnabled
        ? Math.max(0, getMonthlyAccruedLeave(policy, year, monthIndex) - cycleUsed)
        : Number(policy.monthlyAccrual || 0);
      const deduction = policy.salaryDeductionEnabled
        ? roundLeave(Math.max(0, availed - availableBeforeMonth))
        : 0;

      cycleUsed = roundLeave(cycleUsed + availed);

      employee.monthly[monthName].availed = roundLeave(
        employee.monthly[monthName].availed + availed
      );
      employee.monthly[monthName].deduction = roundLeave(
        employee.monthly[monthName].deduction + deduction
      );
      employee[monthName] = employee.monthly[monthName].availed;
      employee.total = roundLeave(employee.total + availed);
      employee.total_availed = employee.total;
      employee.total_deduction = roundLeave(employee.total_deduction + deduction);

      if (typeSummary) {
        typeSummary.monthly[monthName].availed = roundLeave(
          typeSummary.monthly[monthName].availed + availed
        );
        typeSummary.monthly[monthName].deduction = roundLeave(
          typeSummary.monthly[monthName].deduction + deduction
        );
        typeSummary.total_availed = roundLeave(typeSummary.total_availed + availed);
        typeSummary.total_deduction = roundLeave(
          typeSummary.total_deduction + deduction
        );
      }
    });
  });

  Object.values(employeeSummary).forEach((employee) => {
    employee.leave_types = Object.values(employee.leave_types);
  });

  // Convert to array and apply month filter if provided
  let result = Object.values(employeeSummary);

  // Filter by month if specified (returns detailed leave data for that month)
  if (month) {
    const monthIndex = parseInt(month) - 1;
    const monthName = monthNames[monthIndex];

    // Get detailed leaves for the specific month
    const monthStart = new Date(`${year}-${String(month).padStart(2, "0")}-01`);
    const monthEnd = new Date(year, monthIndex + 1, 0); // Last day of month

    const detailedLeaves = await leaveRequestRepos.findAll({
      where: {
        company_id,
        status: "approved",
        ...(employee_id && { employee_id: parseInt(employee_id) }),
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
        {
          attributes: [
            "id",
            "type",
            "annual_days",
            "monthlyAccrual",
            "resetCycleMonths",
            "carryForwardEnabled",
            "salaryDeductionEnabled",
            "status",
          ],
          model: leaveRepos,
          as: "policy",
        },
      ],
      order: [["start_date", "ASC"]],
    });

    return res.status(200).json({
        status: true,
        message: "Monthly leave details fetched successfully",
        data: {
          summary: result.filter(
            (emp) =>
              (emp.monthly?.[monthName]?.availed || 0) > 0 ||
              (emp.monthly?.[monthName]?.deduction || 0) > 0
          ),
        details: detailedLeaves,
        month: monthName,
        year: parseInt(year),
      },
    });
  }
  res.status(200).json({
    status: true,
    message: "Yearly leave summary fetched successfully",
    data: {
      summary: result?.sort((a, b) => a.name.localeCompare(b.name)),
      year: parseInt(year),
      employees: employees.map((e) => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name || ""}`.trim(),
      })),
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
