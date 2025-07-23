// controllers/employeeDocument.controller.js
const { EmployeeDocument } = require("../models");
const { STATUS_CODE } = require("../constants/statusCode");
const { uploadFile } = require("../helpers/fileUpload"); // multer wrapper
const Joi = require("joi");

// create employee document
exports.createEmployeeDocument = async (req, res) => {
  try {
    const data = req.body;
    await employeeDocumentSchema.validateAsync(data);

    const file = req.file;
    if (!file) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({ error: "File is required." });
    }

    const document = await EmployeeDocument.create({
      ...data,
      file_path: file.path,
    });

    res.status(STATUS_CODE.CREATED).json({ message: "Employee document uploaded.", document });
  } catch (err) {
    console.error("Error creating document:", err);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

// get all employee document
exports.getAllDocuments = async (req, res) => {
  try {
    const documents = await EmployeeDocument.findAll();
    res.json({ documents });
  } catch (err) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

// get single employee document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await EmployeeDocument.findByPk(id);
    if (!document) return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Not found" });
    res.json({ document });
  } catch (err) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

// update employee document
exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await employeeDocumentSchema.validateAsync(data);

    const document = await EmployeeDocument.findByPk(id);
    if (!document) return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Not found" });

    const file = req.file;
    if (file) data.file_path = file.path;

    await document.update(data);
    res.json({ message: "Document updated", document });
  } catch (err) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};

// delete employee doucment
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await EmployeeDocument.findByPk(id);
    if (!document) return res.status(STATUS_CODE.NOT_FOUND).json({ error: "Not found" });

    await document.destroy();
    res.json({ message: "Document deleted" });
  } catch (err) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
};
