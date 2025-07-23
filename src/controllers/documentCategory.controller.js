// controllers/documentCategory.controller.js

const { DocumentCategory } = require("../models");
const {  STATUS_CODE } = require("../constants/statusCode");
const { documentCategorySchema } = require("../schema/documentCategory.schema");

module.exports = {
  // Create
  createDocumentCategory: async (req, res) => {
    try {
      const { error, value } = documentCategorySchema.validate(req.body);
      if (error) return res.status(STATUS_CODE.BAD_REQUEST).json({ error: error.details[0].message });

      const newCategory = await DocumentCategory.create(value);
      res.status(STATUS_CODE.CREATED).json({ message: "Document category created", data: newCategory });
    } catch (err) {
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Failed to create document category" });
    }
  },

  // Get all
  getAllDocumentCategory: async (req, res) => {
    try {
      const categories = await DocumentCategory.findAll();
      res.status(STATUS_CODE.OK).json({ data: categories });
    } catch (err) {
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Failed to fetch document categories" });
    }
  },

  // Get by ID
  getDocumentCategoryById: async (req, res) => {
    try {
      const category = await DocumentCategory.findByPk(req.params.id);
      if (!category) return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Not found" });
      res.status(STATUS_CODE.OK).json({ data: category });
    } catch (err) {
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Failed to fetch document category" });
    }
  },

  // Update
  updateDocumentCategory: async (req, res) => {
    try {
      const { error, value } = documentCategorySchema.validate(req.body);
      if (error) return res.status(STATUS_CODE.BAD_REQUEST).json({ error: error.details[0].message });

      const category = await DocumentCategory.findByPk(req.params.id);
      if (!category) return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Not found" });

      await category.update(value);
      res.status(STATUS_CODE.OK).json({ message: "Updated successfully", data: category });
    } catch (err) {
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Failed to update document category" });
    }
  },

  //  Delete
  removeDocumentCagegory: async (req, res) => {
    try {
      const category = await DocumentCategory.findByPk(req.params.id);
      if (!category) return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Not found" });

      await category.destroy();
      res.status(STATUS_CODE.OK).json({ message: "Deleted successfully" });
    } catch (err) {
      res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: "Failed to delete document category" });
    }
  },
};
