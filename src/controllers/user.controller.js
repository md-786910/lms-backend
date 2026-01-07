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
  console.log({ password, hash: user.password });
  const verifyPasswrd = await verifyHashPassword(password, user.password);
  if (!verifyPasswrd) {
    return next(new AppError("Invalid password", STATUS_CODE.BAD_REQUEST));
  }

  //   check admin or employe with company contains email
  const company = await companyRepos.findOne({
    attributes: ["id", "company_name", "logo"],
    where: {
      id: user.company_id,
    },
    raw: true,
  });
  if (!company) {
    return next(new AppError("Company not found", STATUS_CODE.NOT_FOUND));
  }
  if (user.role === ROLE.ADMIN) {
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
      user: { ...user, ...company },
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
  if (user?.is_suspended) {
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
  <div style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 40px; color: #333;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding: 30px; text-align: center; border-bottom: 1px solid #eee;">
          <h2 style="margin: 0; color: #2a2a2a;">🔐 Password Reset Request</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px; font-size: 15px; line-height: 1.6; color: #555;">
          <p>Hello <strong>${user.name || "User"}</strong>,</p>
          <p>We received a request to reset your password for your <strong>LMS Account</strong>. If this was you, click the button below to securely reset your password:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.APP_URL}/reset-password?token=${token}" 
               style="background-color: #007BFF; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007BFF;">
            ${process.env.APP_URL}/reset-password?token=${token}
          </p>
          <p><strong>Note:</strong> This link will expire in 30 minutes for security reasons.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
          <p>© ${new Date().getFullYear()} LMS Platform. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </div>`;
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
  const { id: user_id, role, company_id } = await verifyToken(token)?.sub;
  console.log({ user_id, role, company_id, password, token });
  const hashPass = await hashPassword(password);
  if (role === ROLE.ADMIN) {
    await userRepos.update(
      {
        password: hashPass,
      },
      {
        where: {
          id: user_id,
          company_id,
        },
      }
    );
  } else if (role === ROLE.EMPLOYEE) {
    await employeeRepos.update(
      {
        password: hashPass,
      },
      {
        where: {
          id: user_id,
          company_id,
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

const addNewUser = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(
      new AppError(
        "Please login with correct credential to add new user",
        STATUS_CODE.NOT_FOUND
      )
    );
  }

  const { company_id, role } = req.user;
  if (role !== ROLE.ADMIN) {
    return next(
      new AppError(
        "You are not authorized to add new user",
        STATUS_CODE.NOT_FOUND
      )
    );
  }
  // check email is already exist or not
  const { email, password } = req.body;
  const userExist = await userRepos.findOne({
    where: {
      email,
    },
  });
  if (userExist) {
    return next(
      new AppError(
        "User with this email already exist",
        STATUS_CODE.BAD_REQUEST
      )
    );
  }
  const hashPass = await hashPassword(password);
  const user = await userRepos.create({
    ...req.body,
    password: hashPass,
    password_without_hash: password,
    role: ROLE.LIGHT_ADMIN,
    company_id,
  });
  res.status(STATUS_CODE.CREATED).json({
    status: true,
    message: "User created successfully",
    data: user,
  });
});

// get all user
const getAllUser = catchAsync(async (req, res, next) => {
  const { company_id } = req.user;
  const users = await userRepos.findAll({
    attributes: [
      "id",
      "email",
      "first_name",
      "last_name",
      "phone_number",
      "password",
      "role",
      "password_without_hash",
    ],
    where: {
      company_id,
      role: ROLE.LIGHT_ADMIN,
    },
    order: [["createdAt", "DESC"]],
  });
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "User fetched successfully",
    data: users,
  });
});

const deleteNewUser = catchAsync(async (req, res, next) => {
  const { company_id, role } = req.user;
  if (role !== ROLE.ADMIN) {
    return next(
      new AppError(
        "You are not authorized to delete user",
        STATUS_CODE.NOT_FOUND
      )
    );
  }
  const { id } = req.params;
  if (!id) {
    return next(new AppError("User id not found", STATUS_CODE.NOT_FOUND));
  }

  const user = await userRepos.findOne({
    where: {
      company_id,
      id,
    },
  });
  if (!user) {
    return next(new AppError("User not found", STATUS_CODE.NOT_FOUND));
  }
  // delete
  await user.destroy();

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "User deleted successfully",
  });
});

const changePassword = catchAsync(async (req, res, next) => {
  const { password } = req.body;
  const { id, role, company_id } = req.user;

  const hashPass = await hashPassword(password);

  if (role === ROLE.ADMIN) {
    await userRepos.update(
      {
        password: hashPass,
        password_without_hash: password,
      },
      {
        where: {
          id,
          company_id,
        },
      }
    );
  } else if (role === ROLE.EMPLOYEE) {
    await employeeRepos.update(
      {
        password: hashPass,
      },
      {
        where: {
          id,
          company_id,
        },
      }
    );
  }

  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "Password changed successfully",
  });
});

module.exports = {
  addNewUser,
  loginUser,
  forgotPasswordUser,
  resetPasswordUser,
  verifyEmployeeCreatePassword,
  getAllUser,
  deleteNewUser,
  changePassword,
};
