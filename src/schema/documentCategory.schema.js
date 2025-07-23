const joi = require("joi");
const createDocumentCategory = joi.object({
    name: joi.string().required(),
    company_id: joi.number().required(),
});

module.exports = {
    createDocumentCategory,
}