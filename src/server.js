const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const path = require("path");
const http = require("http");
const app = require("./app.js");
const { ENV_VARIABLE } = require("./constants/env");
// create an HTTP server
const server = http.createServer(app);

const PORT = ENV_VARIABLE.PORT || 8000;
// CORS configuration
const corsOptions = {
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// whitelist = []

async function startServer() {
  try {
    // check .env initialization
    if (!path.join(__dirname, "..", ".env")) {
      console.error("Environment variables are not set correctly.");
      throw new Error("Missing environment variables");
    }

    // database init

    server.listen(PORT, () => {
      console.log(`http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
}

// @[process]
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  app.use((err, req, res, next) => {
    res.status(500).json({ error: "Internal Server Error" });
  });
});
process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection Exception:", err);
  app.use((err, req, res, next) => {
    res.status(500).json({ error: "Internal Server Error" });
  });
  console.error("Unhandled Rejection:", err);
});

process.on("SIGINT", () => {
  console.log("Server shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();
// 