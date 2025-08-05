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
  const verifyPasswrd = await verifyHashPassword(password, user.password);
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
    // check employe suspend or not
    if (user.is_suspended) {
      return next(
        new AppError(
          "Your account is suspended.Please contact to admin",
          STATUS_CODE.BAD_REQUEST
        )
      );
    }
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
    employee_id: user.role === ROLE.EMPLOYEE ? user.id : null,
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

  // check employe suspend or not
  if (user.is_suspended) {
    return next(
      new AppError(
        "Your account is suspended.Please contact to admin",
        STATUS_CODE.BAD_REQUEST
      )
    );
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
  <a href="http://localhost:8080/reset-password?token=${token}">Reset password</a>
  `;
  await sendEmail({
    to: user.email,
    subject: "Reset password for lms account",
    html,
  });

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Email sent to user email",
    data: user,
  });
});

const resetPasswordUser = catchAsync(async (req, res, next) => {
  const { password, token } = req.body;
  // validate token
  const { id: user_id, role } = await verifyToken(token)?.sub;
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

const verifyEmployeeCreatePassword = catchAsync(async (req, res, next) => {
  const { password, token } = req.body;
  const { id: user_id, role } = await verifyToken(token)?.sub;
  if (role === ROLE.EMPLOYEE) {
    // check userId exist or not
    const employee = await employeeRepos.findOne({
      where: {
        id: user_id,
      },
    });
    if (!employee) {
      return next(
        new AppError(
          "email is not associated with employee",
          STATUS_CODE.NOT_FOUND
        )
      );
    }
    employee.password = await hashPassword(password);
    employee.is_email_verified = true;
    employee.is_password_created = true;
    await employee.save();
  } else {
    return next(
      new AppError("User not associated with employee", STATUS_CODE.NOT_FOUND)
    );
  }
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Your password has been created successfully",
  });
});

module.exports = {
  loginUser,
  forgotPasswordUser,
  resetPasswordUser,
  verifyEmployeeCreatePassword,
};
