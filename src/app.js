const cookieParser = require("cookie-parser");
const express = require("express");
const statusMonitor = require("express-status-monitor");

const { STATUS_CODE } = require("./constants/statusCode");
const { globalErrorHandler } = require("./middleware/globalErrorHandler");
const { authenticateClient } = require("./helpers/authenticate");
const { userRoute } = require("./routes");
const { ENV_VARIABLE } = require("./constants/env");

// @ App initialization
const app = express();

// User route
const router = express.Router();

// Admin royte [Do it later]
const adminRouter = express.Router();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Secure HTTP headers
app.set("trust proxy", true);

// static files
app.use(express.static("public"));

// Initialize monitor instance
const monitor = statusMonitor({
  title: "API service monitor",
  path: "/monitor",
  spans: [
    { interval: 1, retention: 60 },
    { interval: 5, retention: 60 },
    { interval: 15, retention: 60 },
  ],
  ignoreStartsWith: "/admin",
});
app.use(monitor);

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.get("/monitor", monitor.pageRoute);


app.get("/", (req, res) => {
  res.status(STATUS_CODE.OK).send("Welcome to the LMS App API");
});

// Middleware for authentication
router.use(authenticateClient);

router.use("/user", userRoute);

// Handling 404 errors
router.use((req, res, next) => {
  res.status(STATUS_CODE.NOT_FOUND).json({
    status: false,
    message: "Route not found",
    data: null,
  });
  next();
});

router.use(globalErrorHandler);

const BASE_PREFIX_URL = `/api/${ENV_VARIABLE.API_VERSION}`;
console.log({ BASE_PREFIX_URL });

app.use("/api/v1", router);

app.use((req, res, next) => {
  res.status(STATUS_CODE.NOT_FOUND).json({
    status: false,
    message: "Route not found",
    data: null,
  });
});
app.use(globalErrorHandler);

module.exports = app;
