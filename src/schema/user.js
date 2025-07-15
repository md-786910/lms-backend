const Joi = require("joi");
const register = Joi.object({
  userName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,128}$"
      )
    )
    .min(6)
    .max(128)
    .required(),
  //   confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
});
module.exports={
    register,
}