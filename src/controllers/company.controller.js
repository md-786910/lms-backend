const db = require("../models");
const { STATUS_CODE } = require("../constants/statusCode");
const catchAsync = require("../utils/catchAsync");
const {
  companyRepos,
  userRepos,
  userSessionRepos,
  countryRepos,
  industryRepos,
} = require("../repository/base");
const sequelize = require("sequelize");
const { generateToken, hashPassword } = require("../helpers/jwt");
const AppError = require("../utils/appError");
const initCompanyDefault = require("../repository/initCompanyDefault");
const Op = sequelize.Op;

// Create a new company
exports.createCompany = catchAsync(async (req, res, next) => {
  if (!req.body) {
    return res.status(STATUS_CODE.NOT_FOUND).json({
      status: false,
      message: "No data found",
    });
  }
  const { company_obj, user } = req.body;

  // check company already exist
  const company = await companyRepos.findOne({
    where: {
      company_name: {
        [Op.iLike]: company_obj.company_name,
      },
    },
  });
  if (company) {
    return res.status(STATUS_CODE.BAD_REQUEST).json({
      status: false,
      message: "Company already exist",
    });
  }

  const transaction = await db.sequelize.transaction();
  try {
    // @start transaction
    const companyCreate = await companyRepos.create(
      { ...company_obj },
      { transaction }
    );

    // @create company user - admin while company registering
    const isUserExist = await userRepos.findOne({
      where: {
        email: user.email,
      },
    });
    if (isUserExist) {
      await transaction.rollback();
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        status: false,
        message: "email already exist",
      });
    }

    // hash password
    const hashPass = await hashPassword(user.password);
    const newUser = await userRepos.create(
      {
        ...user,
        company_id: companyCreate.id,
        password: hashPass,
      },
      { transaction }
    );
    // create token and session
    const token = await generateToken({
      id: newUser.id,
      email: newUser.email,
      company_id: companyCreate.id,
      role: "admin",
      country_id: companyCreate.country_id,
    });
    // login admin
    await userSessionRepos.create(
      {
        user_id: newUser.id,
        token,
        employe_id: null,
      },
      { transaction }
    );
    // @end transaction
    await transaction.commit();

    // @just initialization company with default setup
    await initCompanyDefault(companyCreate.id);
    // end

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // ✅ 7 days in milliseconds
    });

    return res.status(STATUS_CODE.CREATED).json({
      status: true,
      message: "Company created successfully",
      data: {
        company: companyCreate,
        user: newUser,
        token,
      },
    });
  } catch (error) {
    console.log({ error });
    await transaction.rollback();
    next(new AppError(error, STATUS_CODE.INTERNAL_SERVER_ERROR));
  }
});

exports.searchCompany = catchAsync(async (req, res, next) => {
  if (!req.query) {
    return next(new AppError("query not found", STATUS_CODE.NOT_FOUND));
  }
  const { company_name } = req.query;
  if (!company_name) {
    return next(new AppError("company name not found", STATUS_CODE.NOT_FOUND));
  }
  console.log({ company_name });
  const companyExist = await companyRepos.findOne({
    where: {
      company_name: {
        [Op.iLike]: `${company_name}`,
      },
    },
  });
  if (companyExist) {
    return next(new AppError("company already exist", STATUS_CODE.BAD_REQUEST));
  }
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "ok",
  });
});

// Get a single company by ID
exports.getCompanyById = async (req, res, next) => {
  try {
    const {
      company_id,
      id,
      first_name,
      last_name,
      phone_number,
      phone_country_code,
      email,
    } = req.user;
    if (!company_id) {
      return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
    }
    const company = await companyRepos.findByPk(company_id, {
      include: [
        { model: countryRepos, as: "country" },
        { model: industryRepos, as: "industry" },
      ],
    });

    if (!company) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        status: false,
        message: "Company not found",
      });
    }

    company["dataValues"].user = {
      id,
      first_name,
      last_name,
      phone_number,
      phone_country_code,
      email,
    };

    res.status(STATUS_CODE.OK).json({
      status: true,
      message: "Company fetched successfully",
      data: company,
    });
  } catch (error) {
    next(new AppError(error, STATUS_CODE.INTERNAL_SERVER_ERROR));
  }
};

// Update a company
exports.updateCompany = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        status: false,
        message: "No data found",
      });
    }
    const { company_id, id } = req.user;
    if (!company_id) {
      return next(new AppError("company id not found", STATUS_CODE.NOT_FOUND));
    }

    // update user phone number
    await userRepos.update(
      {
        phone_number: req.body?.phone_number,
      },
      {
        where: {
          id,
        },
      }
    );

    const [updated] = await companyRepos.update(req.body, {
      where: { id: company_id },
    });

    if (updated === 0) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        status: false,
        message: "Company not found or nothing to update",
      });
    }
    const updatedCompany = await companyRepos.findByPk(company_id);
    res.status(STATUS_CODE.OK).json({
      status: true,
      message: "Company updated successfully",
      data: updatedCompany,
    });
  } catch (error) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to update company",
      error: error.message,
    });
  }
};

// Delete a company
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Company.destroy({ where: { id } });

    if (!deleted) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        status: false,
        message: "Company not found",
      });
    }

    res.status(STATUS_CODE.OK).json({
      status: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("Delete company error:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to delete company",
      error: error.message,
    });
  }
};
