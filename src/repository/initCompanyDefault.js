const {
  currenciesData,
  departmentsData,
  designationsData,
  prefixData,
  leavesData,
  documentData,
} = require("../data/general");
const {
  currencyRepos,
  departmentRepos,
  designationRepos,
  prefixRepos,
  leaveRepos,
  documentCategoryRepos,
} = require("./base");
const db = require("../models");

module.exports = async (company_id) => {
  const transaction = await db.sequelize.transaction();
  try {
    // @create default currency
    console.log("setup initialization for ", company_id);
    for (const currency of currenciesData) {
      await currencyRepos.create(
        {
          ...currency,
          company_id,
        },
        { transaction }
      );
    }
    // @default department
    for (department of departmentsData) {
      await departmentRepos.create(
        {
          ...department,
          company_id,
        },
        { transaction }
      );
    }

    // @default designation
    for (const designation of designationsData) {
      await designationRepos.create(
        {
          ...designation,
          company_id,
        },
        { transaction }
      );
    }
    // prefix
    for (const prefix of prefixData) {
      await prefixRepos.create(
        {
          ...prefix,
          company_id,
        },
        { transaction }
      );
    }

    // leave
    for (const leave of leavesData) {
      await leaveRepos.create(
        {
          ...leave,
          company_id,
        },
        { transaction }
      );
    }

    // document category
    for (const docCategory of documentData) {
      await documentCategoryRepos.create(
        {
          ...docCategory,
          company_id,
        },
        { transaction }
      );
    }

    // Templates
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
