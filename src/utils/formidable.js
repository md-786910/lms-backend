const formidable = require("formidable");
const form = new formidable.IncomingForm();

// Set upload directory
form.uploadDir = path.join(__dirname, "uploads");
form.keepExtensions = true; // Keep the file extensions

form.parse(req, (err, fields, files) => {
  if (err) {
    console.error("Error parsing form:", err);
    return res.status(400).send("Error in file upload");
  }

  console.log("Fields:", fields); // Form fields (non-file data)
  console.log("Files:", files); // Uploaded files

  res.send("File uploaded successfully");
});
