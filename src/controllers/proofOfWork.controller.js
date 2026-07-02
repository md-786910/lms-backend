const { Op } = require("sequelize");
const { STATUS_CODE } = require("../constants/statusCode");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const db = require("../models");
const {
  proofOfWorkSubmissionRepos,
  proofOfWorkAttachmentRepos,
  fileRepos,
  employeeRepos,
  userRepos,
  activityRepos,
  notificationRepos,
  extraWorkLeaveBalanceRepos,
  extraWorkLeaveTransactionRepos,
} = require("../repository/base");

const submissionInclude = [
  {
    model: proofOfWorkAttachmentRepos,
    as: "attachments",
    include: [{ model: db.file, as: "file" }],
  },
  {
    model: employeeRepos,
    as: "employee",
    attributes: ["id", "first_name", "last_name", "employee_no"],
  },
  {
    model: userRepos,
    as: "reviewer",
    attributes: ["id", "first_name", "last_name", "email"],
  },
];

const getEmployeeName = (employee) => {
  if (!employee) return "Employee";
  return `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Employee";
};

const notifyAdmins = async ({ company_id, employee, title }) => {
  const admins = await userRepos.findAll({
    attributes: ["id", "role"],
    where: { company_id, role: { [Op.in]: ["admin", "light_admin"] } },
  });

  await Promise.all(
    admins.map((admin) =>
      notificationRepos.notifyUser({
        user_id: admin.id,
        company_id,
        title: "proof_of_work",
        message: `New proof of work submitted by ${getEmployeeName(employee)}: ${title}`,
        role: admin.role || "admin",
      })
    )
  );
};

const notifyEmployeeReview = async ({ company_id, employee_id, status, title }) => {
  await notificationRepos.notifyUser({
    user_id: employee_id,
    company_id,
    title: "proof_of_work",
    message: `Your proof of work "${title}" has been ${status}`,
    role: "employee",
  });
};

const getCreditDays = (workingHours) => {
  if (workingHours === "half_day") return 0.5;
  return 1;
};

const creditExtraWorkLeave = async ({ submission, transaction }) => {
  const existingCredit = await extraWorkLeaveTransactionRepos.findOne({
    where: {
      transaction_type: "credit",
      source_type: "proof_of_work",
      source_id: submission.id,
    },
    transaction,
  });

  if (existingCredit) return;

  const days = getCreditDays(submission.working_hours);
  const [balance] = await extraWorkLeaveBalanceRepos.findOrCreate({
    where: {
      company_id: submission.company_id,
      employee_id: submission.employee_id,
    },
    defaults: {
      company_id: submission.company_id,
      employee_id: submission.employee_id,
      total_earned: 0,
      total_used: 0,
      balance: 0,
    },
    transaction,
  });

  balance.total_earned = Number(balance.total_earned || 0) + days;
  balance.balance = Number(balance.balance || 0) + days;
  await balance.save({ transaction });

  await extraWorkLeaveTransactionRepos.create(
    {
      company_id: submission.company_id,
      employee_id: submission.employee_id,
      transaction_type: "credit",
      source_type: "proof_of_work",
      source_id: submission.id,
      days,
      balance_after: balance.balance,
      description: `Proof of work approved: ${submission.title}`,
    },
    { transaction }
  );
};

const ensureFilesExist = async (fileIds) => {
  const uniqueFileIds = [...new Set(fileIds.map(Number))];
  const files = await fileRepos.findAll({
    attributes: ["id"],
    where: { id: { [Op.in]: uniqueFileIds } },
  });
  if (files.length !== uniqueFileIds.length) {
    throw new AppError("One or more evidence files were not found", STATUS_CODE.BAD_REQUEST);
  }
  return uniqueFileIds;
};

const createProofOfWork = catchAsync(async (req, res, next) => {
  const { id: employee_id, company_id } = req.user;
  const { title, work_type, working_hours, work_date, description, file_ids } = req.body;

  let uniqueFileIds;
  try {
    uniqueFileIds = await ensureFilesExist(file_ids);
  } catch (error) {
    return next(error);
  }

  const transaction = await db.sequelize.transaction();
  let submission;
  try {
    submission = await proofOfWorkSubmissionRepos.create(
      {
        company_id,
        employee_id,
        title,
        work_type,
        working_hours,
        work_date,
        description,
        status: "pending",
      },
      { transaction }
    );

    await proofOfWorkAttachmentRepos.bulkCreate(
      uniqueFileIds.map((file_id) => ({
        proof_of_work_id: submission.id,
        file_id,
        attachment_type: "evidence",
      })),
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    return next(new AppError(error.message, STATUS_CODE.INTERNAL_SERVER_ERROR));
  }

  const employee = await employeeRepos.findOne({
    where: { id: employee_id, company_id },
    attributes: ["id", "first_name", "last_name"],
  });

  await activityRepos.addActivity({
    company_id,
    employee_id,
    title: `${getEmployeeName(employee)} submitted proof of work`,
    message: title,
    role: "employee",
  });
  await notifyAdmins({ company_id, employee, title });

  const created = await proofOfWorkSubmissionRepos.findOne({
    where: { id: submission.id, company_id, employee_id },
    include: submissionInclude,
  });

  res.status(STATUS_CODE.CREATED).json({
    status: true,
    message: "Proof of work submitted successfully",
    data: created,
  });
});

const getMyProofOfWork = catchAsync(async (req, res) => {
  const { id: employee_id, company_id } = req.user;
  const submissions = await proofOfWorkSubmissionRepos.findAll({
    where: { company_id, employee_id },
    include: submissionInclude,
    order: [["createdAt", "DESC"]],
  });

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Proof of work submissions fetched successfully",
    data: submissions,
  });
});

const getMyProofOfWorkById = catchAsync(async (req, res, next) => {
  const { id: employee_id, company_id } = req.user;
  const { id } = req.params;
  const submission = await proofOfWorkSubmissionRepos.findOne({
    where: { id, company_id, employee_id },
    include: submissionInclude,
  });

  if (!submission) {
    return next(new AppError("Proof of work submission not found", STATUS_CODE.NOT_FOUND));
  }

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Proof of work submission fetched successfully",
    data: submission,
  });
});

const getEmployeeProofOfWork = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const { employee_id } = req.params;

  const employee = await employeeRepos.findOne({
    where: { id: employee_id, company_id },
    attributes: ["id"],
  });
  if (!employee) {
    return next(new AppError("Employee not found", STATUS_CODE.NOT_FOUND));
  }

  const submissions = await proofOfWorkSubmissionRepos.findAll({
    where: { company_id, employee_id },
    include: submissionInclude,
    order: [["createdAt", "DESC"]],
  });

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Employee proof of work submissions fetched successfully",
    data: submissions,
  });
});

const reviewProofOfWork = (status) =>
  catchAsync(async (req, res, next) => {
    const { id: reviewer_id, company_id } = req.user;
    const { id } = req.params;
    const { manager_comment = null } = req.body;

    const submission = await proofOfWorkSubmissionRepos.findOne({
      where: { id, company_id },
      include: [{ model: employeeRepos, as: "employee", attributes: ["id", "first_name", "last_name"] }],
    });

    if (!submission) {
      return next(new AppError("Proof of work submission not found", STATUS_CODE.NOT_FOUND));
    }

    if (submission.status !== "pending") {
      return next(new AppError("Only pending proof of work submissions can be reviewed", STATUS_CODE.BAD_REQUEST));
    }

    const transaction = await db.sequelize.transaction();
    try {
      submission.status = status;
      submission.manager_comment = manager_comment;
      submission.reviewed_by = reviewer_id;
      submission.reviewed_at = new Date();
      await submission.save({ transaction });

      if (status === "approved") {
        await creditExtraWorkLeave({ submission, transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      return next(
        new AppError(
          error.message || "Error reviewing proof of work",
          STATUS_CODE.INTERNAL_SERVER_ERROR
        )
      );
    }

    await activityRepos.addActivity({
      company_id,
      employee_id: submission.employee_id,
      title: `Proof of work ${status}`,
      message: submission.title,
      role: "admin",
    });
    await notifyEmployeeReview({
      company_id,
      employee_id: submission.employee_id,
      status,
      title: submission.title,
    });

    const reviewed = await proofOfWorkSubmissionRepos.findOne({
      where: { id: submission.id, company_id },
      include: submissionInclude,
    });

    res.status(STATUS_CODE.OK).json({
      status: true,
      message: `Proof of work ${status} successfully`,
      data: reviewed,
    });
  });

module.exports = {
  createProofOfWork,
  getMyProofOfWork,
  getMyProofOfWorkById,
  getEmployeeProofOfWork,
  approveProofOfWork: reviewProofOfWork("approved"),
  rejectProofOfWork: reviewProofOfWork("rejected"),
};
