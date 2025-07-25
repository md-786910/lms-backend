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

const forgotPassword = Joi.object({
  email: Joi.string().email().required(),
});

const createNewPassword = Joi.object({
  password: Joi.string().min(6).max(128).required(),
  token: Joi.string().required(),
});

module.exports = {
  login,
  forgotPassword,
  createNewPassword,
};
