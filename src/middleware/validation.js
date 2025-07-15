const Joi = require("joi");
const AppError = require("../utils/appError");
const joiValidation = (schema) => {
  return (req, res, next) => {
    let postdata = { ...req.body };
    const { error, value } = schema.validate(postdata);
    if (error == undefined) {
      next();
    } else {
      next(error);
    }
  };
};

const emptyCheck = (schema) => {
  return (req, res, next) => {
    let postdata = { ...req.body };

    const { error, value } = Joi.object({}).validate(postdata);

    if (error == undefined) {
      next();
    } else {
      next(error);
    }
  };
};

const postCheckArray = (schema) => {
  return (req, res, next) => {
    let postdata = req.body;

    const { error, value } = schema.validate({ data: postdata });

    if (error == undefined) {
      next();
    } else {
      next(new AppError(error, 400));
    }
  };
};
const getCheck = (schema) => {
  return (req, res, next) => {
    const postdata = { ...req.query };
    const { error, value } = schema.validate(postdata);
    if (error == undefined) {
      next();
    } else {
      next(new AppError(error, 400));
    }
  };
};

module.exports = {
  joiValidation,
  emptyCheck,
  postCheckArray,
    getCheck,
}