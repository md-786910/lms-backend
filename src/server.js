const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const http = require("http");
const app = require("./app.js");
const { ENV_VARIABLE } = require("./constants/env");
const db = require("./models/index.js");
const { initSocket } = require("./config/initsocket.js");
// create an HTTP server
const server = http.createServer(app);

const PORT = ENV_VARIABLE.PORT || 8000;
// CORS configuration

// whitelist = []

async function startServer() {
  try {
    // check .env initialization
    if (!path.join(__dirname, "..", ".env")) {
      console.error("Environment variables are not set correctly.");
      throw new Error("Missing environment variables");
    }

    // database init

    // Test database connection
    await db.sequelize
      .authenticate()
      .then(() => {
        console.log("Database connected successfully!");
      })
      .catch((err) => {
        console.error("Error connecting to the database:", err);
      });

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
startServer().then(() => {
  console.log("socket start");
  const io = initSocket(server);
});
//
