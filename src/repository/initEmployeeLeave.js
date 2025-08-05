const db = require("../models");
const { leaveRepos, employeLeaveRepos } = require("./base");

module.exports = async ({ company_id, employee_id }) => {
  const transaction = await db.sequelize.transaction();
  try {
    // @create leave for employee
    const allLeave = await leaveRepos.findAll({
      where: {
        company_id,
      },
    });

    for (const leave of allLeave) {
      const { id, type, annual_days } = leave;
      await employeLeaveRepos.create(
        {
          company_id,
          employee_id,
          leave_id: id,
          leave_count: annual_days,
          leave_type: type,
          leave_remaing: annual_days,
        },
        { transaction }
      );
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
