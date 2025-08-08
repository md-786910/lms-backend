const { salaryHistoryRepos } = require("../repository/base");
const catchAsync = require("../utils/catchAsync");
const { Op } = require("sequelize");
const salaryDashbaord = catchAsync(async (req, res, next) => {
  // get current month and year get year and month from client side use dayjs
  if (!req.query) {
    return next(new AppError("query not found", STATUS_CODE.NOT_FOUND));
  }
  const { company_id } = req.user;
  const { month, year } = req.query;

  const salary = await salaryHistoryRepos.findAll({
    where: {
      company_id,
      //   [Op.and]: [
      //     Op.Sequelize.where(
      //       Sequelize.fn("YEAR", Sequelize.col("createdAt")),
      //       year
      //     ),
      //     Op.Sequelize.where(
      //       Sequelize.fn("MONTH", Sequelize.col("createdAt")),
      //       month
      //     ),
      //   ],
    },
  });

  res.status(200).json({
    status: true,
    message: "Salary dashboard fetched successfully",
    dara: salary,
  });
});

module.exports = {
  salaryDashbaord,
};
