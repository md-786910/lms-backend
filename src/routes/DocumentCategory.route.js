// routes/documentCategory.routes.js

const express = require("express");
const router = express.Router();
const controller = require("../controllers/documentCategory.controller");
const authMiddleware = require("../middleware/auth.middleware"); // optional JWT
const { joiValidation } = require("../middleware/validation");

router.use(authMiddleware); // apply JWT middleware to all routes if needed

router.post("/",joiValidation(createDocumentCategory), controller.createDocumentCategory);
router.get("/", controller.getAllDocumentCategory);
router.get("/:id", controller.getDocumentCategoryById);
router.put("/:id", controller.updateDocumentCategory);
router.delete("/:id", controller.removeDocumentCagegory);

module.exports = router;
