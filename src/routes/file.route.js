const express = require("express");
const formidable = require("formidable");
const path = require("path");
const {
  uploadFiles,
  getFileById,
  getAllFiles,
} = require("../controllers/file.controller");
const AppError = require("../utils/appError");
const { STATUS_CODE } = require("../constants/statusCode");

const router = express.Router();

router.post("/upload", (req, res, next) => {
  const form = new formidable.IncomingForm();

  form.uploadDir = path.join(__dirname, "..", "uploads");
  form.keepExtensions = true;
  form.multiples = true;
  form.maxFileSize = 10 * 1024 * 1024; // Set max file size to 10MB

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return next(
        new AppError("Error in file upload", STATUS_CODE.BAD_REQUEST)
      );
    }

    // Flatten the files object to handle all uploaded files
    let uploadedFiles = [];
    for (const key in files) {
      if (Object.hasOwnProperty.call(files, key)) {
        uploadedFiles = uploadedFiles.concat(files[key]);
      }
    }
    try {
      const fileIds = await uploadFiles(uploadedFiles);
      return res
        .status(201)
        .json({ message: "File uploaded successfully", status: true, fileIds });
    } catch (uploadError) {
      console.error("Error handling file uploads:", uploadError);
      return res.status(500).json({
        message: uploadError.message,
        status: false,
      });
    }
  });
});

// Get file by ID route
router.get("/file/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const file = await getFileById(id);
    return res.redirect(file.filePath);
  } catch (err) {
    console.error("Error fetching file:", err);
    return res
      .status(500)
      .json({ message: "Error fetching file", error: err.message });
  }
});

// Get all files route
router.get("/files", async (req, res) => {
  try {
    const files = await getAllFiles();
    return res.json(files);
  } catch (err) {
    console.error("Error fetching files:", err);
    return res
      .status(500)
      .json({ message: "Error fetching files", error: err.message });
  }
});

module.exports = router;
