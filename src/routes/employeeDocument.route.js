const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeeDocument.controller");
const { upload } = require("../middleware/multer.middleware");
const { authenticate } = require("../middleware/auth.middleware");
const { joiValidation } = require("../middleware/validation");

// All routes protected with JWT
router.use(authenticate);

//  Upload route with multer
router.post("/",joiValidation(createEmployeeDocument), upload.single("file"), controller.createEmployeeDocument);

//  Standard CRUD routes
router.get("/",joiValidation(createEmployeeDocument), controller.getAllDocuments);
router.get("/:id", controller.getDocumentById);
router.put("/:id", upload.single("file"), controller.updateDocument);
router.delete("/:id", controller.deleteDocument);

module.exports = router;
