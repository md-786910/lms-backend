const { STATUS_CODE } = require("../constants/statusCode");
const { ROLE } = require("../constants/user");
const {
  verifyHashPassword,
  generateToken,
  verifyToken,
  hashPassword,
} = require("../helpers/jwt");
const {
  userRepos,
  companyRepos,
  userSessionRepos,
  employeeRepos,
} = require("../repository/base");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/sendMail");

async function checkIsAdminorEmploye(email) {
  let user = null;
  const userExist = await userRepos.findOne({
    where: {
      email,
    },
    raw: true,
  });
  if (userExist) {
    user = userExist;
  }
  // employee
  const employee = await employeeRepos.findOne({
    where: {
      email,
    },
    raw: true,
  });
  if (employee) {
    user = employee;
  }
  return user;
}

const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  let user = await checkIsAdminorEmploye(email);
  if (!user) {
    return next(new AppError("User not found", STATUS_CODE.NOT_FOUND));
  }
  //   verify password
  const verifyPasswrd = verifyHashPassword(password, user.password);
  if (!verifyPasswrd) {
    return next(new AppError("Invalid password", STATUS_CODE.BAD_REQUEST));
  }

  //   check admin or employe with company contains email
  if (user.role === ROLE.ADMIN) {
    const company = await companyRepos.findOne({
      where: {
        id: user.company_id,
      },
    });
    if (!company) {
      return next(new AppError("Company not found", STATUS_CODE.NOT_FOUND));
    }
    user = { ...user, company_id: company.id };
  } else if (user.role === ROLE.EMPLOYEE) {
    user = { ...user, company_id: user.company_id };
  } else {
    //skip
  }

  //   generare token
  const token = await generateToken({
    id: user.id,
    email: user.email,
    company_id: user.company_id,
    role: user.role,
  });

  await userSessionRepos.create({
    user_id: user.role === ROLE.ADMIN ? user.id : null,
    token,
    employe_id: user.role === ROLE.EMPLOYEE ? user.id : null,
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // ✅ 7 days in milliseconds
  });

  return res.status(STATUS_CODE.CREATED).json({
    status: true,
    message: "user login successfully",
    data: {
      user,
      token,
    },
  });
});

const forgotPasswordUser = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  let user = await checkIsAdminorEmploye(email);
  if (!user) {
    return next(new AppError("User not found", STATUS_CODE.NOT_FOUND));
  }
  const token = await generateToken(
    {
      id: user.id,
      email: user.email,
      company_id: user.company_id,
      role: user.role,
    },
    "1h"
  );
  /*
  1. generate link with token and send to email
  2. save token in database
  */

  const html = `
  <h1>Forgot password will send here with token</h1>
  <a href="http://localhost:3000/forgot-password?token=${token}">Reset password</a>
  `;
  await sendEmail({
    to: user.email,
    subject: "Forgot password for lms account",
    html,
  });

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "User found",
    data: user,
  });
});

const resetPasswordUser = catchAsync(async (req, res, next) => {
  const { password, token } = req.body;
  // validate token
  const { id: user_id, role } = await verifyToken(token);
  if (role === ROLE.ADMIN) {
    await userRepos.update(
      {
        password: await hashPassword(password),
      },
      {
        where: {
          id: user_id,
        },
      }
    );
  } else if (role === ROLE.EMPLOYEE) {
    await employeeRepos.update(
      {
        password: await hashPassword(password),
      },
      {
        where: {
          id: user_id,
        },
      }
    );
  } else {
    // skipp
  }

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Password reset successfully",
  });
});

module.exports = {
  loginUser,
  forgotPasswordUser,
  resetPasswordUser,
};
