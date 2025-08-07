const db = require("../models");
const { employeeDocumentRepos } = require("../repository/base");
const cloudinaryv2 = require("../utils/cloudinary");
const fs = require("fs");
exports.uploadFiles = async (files) => {
  const uploadPromises = files.map(async (file) => {
    const filePath = file.filepath;
    console.log({ filePath });

    if (!fs.existsSync(filePath)) {
      console.log(`File does not exist at ${filePath}`);
      throw new Error(`File not found: ${filePath}`);
    }
    try {
      const cloudinaryResponse = await cloudinaryv2.uploader.upload(filePath);
      const resl = await db.file.create({
        file_name: file.originalFilename,
        file_path: cloudinaryResponse.secure_url,
        cloudinary_id: cloudinaryResponse.public_id,
      });

      // Remove the file from the local `uploads/` directory after successful upload
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting local file: ${filePath}`, err);
        } else {
          console.log(`Successfully deleted local file: ${filePath}`);
        }
      });

      return {
        file_id: resl.id,
        file_path: cloudinaryResponse.secure_url,
      };
    } catch (error) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting local file: ${filePath}`, err);
          throw new Error(err);
        } else {
          console.log(`Failed upload, but local file deleted: ${filePath}`);
        }
      });
      throw new Error(error);
    }
  });

  try {
    const fileIds = await Promise.all(uploadPromises);
    return fileIds;
  } catch (error) {
    console.log({ error });
    throw new Error(error.message);
  }
};

// Function to get file by ID
exports.getFileById = async (id) => {
  try {
    const file = await employeeDocumentRepos.findByPk(id);
    if (!file) {
      throw new Error("File not found");
    }
    return file;
  } catch (err) {
    throw new Error("Error fetching file: " + err.message);
  }
};

// Function to get all files
exports.getAllFiles = async () => {
  try {
    const files = await employeeDocumentRepos.findAll();
    return files;
  } catch (err) {
    throw new Error("Error fetching files: " + err.message);
  }
};

// Delete file after upload (optional)
exports.deleteUploadedFile = async (cloudinaryId) => {
  try {
    const result = await cloudinaryv2.uploader.destroy(cloudinaryId);
    if (result.result === "ok") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw new Error("Error deleting file from Cloudinary");
  }
};
