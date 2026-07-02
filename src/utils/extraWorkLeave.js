const { STATUS_CODE } = require("../constants/statusCode");
const AppError = require("./appError");

const EXTRA_WORK_LEAVE_LABEL = "Extra Work Leave";
const EXTRA_WORK_LEAVE_TYPE = "extra_work";

const roundLeave = (value) => Math.round(Number(value || 0) * 100) / 100;

const attachExtraWorkLeaveType = (leaveRequest) => {
  leaveRequest.dataValues.leave_type = {
    id: null,
    leave_id: null,
    leave_type: EXTRA_WORK_LEAVE_LABEL,
  };
  return leaveRequest;
};

const buildEmptyExtraWorkBalance = () => ({
  total_earned: 0,
  total_used: 0,
  balance: 0,
});

const getExtraWorkBalance = async ({
  extraWorkLeaveBalanceRepos,
  company_id,
  employee_id,
  transaction,
}) => {
  const balance = await extraWorkLeaveBalanceRepos.findOne({
    where: { company_id, employee_id },
    transaction,
  });

  if (!balance) return buildEmptyExtraWorkBalance();

  return {
    total_earned: roundLeave(balance.total_earned),
    total_used: roundLeave(balance.total_used),
    balance: roundLeave(balance.balance),
  };
};

const getPendingExtraWorkDays = async ({
  leaveRequestRepos,
  company_id,
  employee_id,
}) => {
  const pendingRequests = await leaveRequestRepos.findAll({
    where: {
      company_id,
      employee_id,
      request_type: EXTRA_WORK_LEAVE_TYPE,
      status: "pending",
    },
    attributes: ["total_days"],
  });

  return roundLeave(
    pendingRequests.reduce((sum, request) => sum + Number(request.total_days || 0), 0)
  );
};

const validateExtraWorkLeaveAvailability = async ({
  extraWorkLeaveBalanceRepos,
  leaveRequestRepos,
  company_id,
  employee_id,
  total_days,
  includePending = true,
  transaction,
}) => {
  const balanceRecord = await extraWorkLeaveBalanceRepos.findOne({
    where: { company_id, employee_id },
    transaction,
  });
  const balance = Number(balanceRecord?.balance || 0);
  const pendingDays = includePending
    ? await getPendingExtraWorkDays({ leaveRequestRepos, company_id, employee_id })
    : 0;
  const available = roundLeave(balance - pendingDays);
  const requested = Number(total_days || 0);

  if (requested <= 0) {
    throw new AppError("Total days must be greater than zero", STATUS_CODE.BAD_REQUEST);
  }

  if (requested > available) {
    throw new AppError(
      `Insufficient Extra Work Leave balance. Available: ${available}`,
      STATUS_CODE.BAD_REQUEST
    );
  }

  return { balanceRecord, available };
};

const debitExtraWorkLeave = async ({
  extraWorkLeaveBalanceRepos,
  extraWorkLeaveTransactionRepos,
  leaveRequest,
  transaction,
}) => {
  const existingDebit = await extraWorkLeaveTransactionRepos.findOne({
    where: {
      transaction_type: "debit",
      source_type: "leave_request",
      source_id: leaveRequest.id,
    },
    transaction,
  });

  if (existingDebit) return;

  const balance = await extraWorkLeaveBalanceRepos.findOne({
    where: {
      company_id: leaveRequest.company_id,
      employee_id: leaveRequest.employee_id,
    },
    transaction,
  });

  const requested = Number(leaveRequest.total_days || 0);
  if (!balance || Number(balance.balance || 0) < requested) {
    throw new AppError("Insufficient Extra Work Leave balance", STATUS_CODE.BAD_REQUEST);
  }

  balance.total_used = roundLeave(Number(balance.total_used || 0) + requested);
  balance.balance = roundLeave(Number(balance.balance || 0) - requested);
  await balance.save({ transaction });

  await extraWorkLeaveTransactionRepos.create(
    {
      company_id: leaveRequest.company_id,
      employee_id: leaveRequest.employee_id,
      transaction_type: "debit",
      source_type: "leave_request",
      source_id: leaveRequest.id,
      days: requested,
      balance_after: balance.balance,
      description: `Extra Work Leave used for leave request #${leaveRequest.id}`,
    },
    { transaction }
  );
};

module.exports = {
  EXTRA_WORK_LEAVE_LABEL,
  EXTRA_WORK_LEAVE_TYPE,
  attachExtraWorkLeaveType,
  getExtraWorkBalance,
  validateExtraWorkLeaveAvailability,
  debitExtraWorkLeave,
};
