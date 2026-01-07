const Joi = require("joi");
const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    // .pattern(
    //   new RegExp(
    //     "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,128}$"
    //   )
    // )
    .min(6)
    .max(128)
    .required(),
});

const createNewUser = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().allow("", null),
  phone_number: Joi.string().allow("", null),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().required(),
});

const createNewPassword = Joi.object({
  password: Joi.string().min(6).max(128).required(),
  token: Joi.string().required(),
});

const verifyEmployee = Joi.object({
  password: Joi.string().min(6).max(128).required(),
  token: Joi.string().required(),
});

const changePassword = Joi.object({
  password: Joi.string().min(6).max(128).required(),
  confirm_password: Joi.string().valid(Joi.ref("password")).required(),
});

module.exports = {
  login,
  forgotPassword,
  createNewPassword,
  verifyEmployee,
  createNewUser,
  changePassword,
};
