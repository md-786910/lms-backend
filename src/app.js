const cookieParser = require("cookie-parser");
const express = require("express");
const statusMonitor = require("express-status-monitor");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const { STATUS_CODE } = require("./constants/statusCode");
const { globalErrorHandler } = require("./middleware/globalErrorHandler");
const {
  authenticateAdmin,
  authenticateEmployee,
} = require("./helpers/authenticate");
const {
  userRoute,
  companyRoute,
  settingsRoute,
  fileRoute,
  companyEmployeeRoute,
  companyLeaveRoute,
} = require("./routes");
const { ENV_VARIABLE } = require("./constants/env");
const { countryRepos } = require("./repository/base");
const leaveRouter = require("./routes/employee/leave.route");
const dashboardRoute = require("./routes/dashboardRoute.route");
const employeeDashboardRouter = require("./routes/employee/dashboard.route");
const profileRouter = require("./routes/employee/profile.route");
const notificationRouter = require("./routes/notification.route");
const Pdf = require("./config/Pdf");

// @ App initialization
const app = express();

// User route
const router = express.Router();
const employeeRouter = express.Router();

// add cors
const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
router.use(cors(corsOptions));
employeeRouter.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Set EJS as the view engine
app.set("view engine", "ejs");

// Set the views folder where EJS templates are located
app.set("views", path.join(__dirname, "views"));

// make static files accessible
app.use("/uploads", express.static("uploads"));

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
app.get("/api/v1/country", async (req, res) => {
  const countries = await countryRepos.findAll({});
  res.status(STATUS_CODE.OK).json({
    status: true,
    message: "All countries fetched",
    data: countries,
  });
});

app.get("/", (req, res) => {
  res.status(STATUS_CODE.OK).send("Welcome to the LMS App API");
});

// pdf
app.get("/pdf", async (req, res) => {
  try {
    const month = 10;
    const emp_id = 12;
    const pdfPath = `${month}.pdf`;
    const pd = await Pdf.create("pdf.ejs", {}, `document/${emp_id}/`, pdfPath);
    res.send(pd);
  } catch (error) {
    res.json(error);
  }
  // exec(`weasyprint input.html output.pdf`, (err) => {
  //   if (err) return res.status(500).send("Error generating PDF");
  //   res.sendFile(__dirname + "/output.pdf");
  // });
});

// notification
app.use("/notification", notificationRouter);

// admin routes (admin)
router.use(authenticateAdmin);
router.use("/company", companyRoute);
router.use("/setting", settingsRoute);

// dashboard
router.use("/dashboard", dashboardRoute);

// employee routes
router.use("/company/employee", companyEmployeeRoute);
router.use("/company/leave", companyLeaveRoute);
router.use("/file", fileRoute);

// for auth
router.use("/user", userRoute);

//========================Employee router=================================================
employeeRouter.use(authenticateEmployee);
employeeRouter.use("/leave", leaveRouter);
employeeRouter.use("/dashboard", employeeDashboardRouter);
employeeRouter.use("/profile", profileRouter);
// employeeRouter.use("/salary", leaveRouter);

// Handling 404 errors
router.use((req, res, next) => {
  res.status(STATUS_CODE.NOT_FOUND).json({
    status: false,
    message: "Route not found",
    data: null,
  });
  next();
});
employeeRouter.use((req, res, next) => {
  res.status(STATUS_CODE.NOT_FOUND).json({
    status: false,
    message: "Route not found",
    data: null,
  });
  next();
});

router.use(globalErrorHandler);
employeeRouter.use(globalErrorHandler);

const BASE_PREFIX_URL = `/api/${ENV_VARIABLE.API_VERSION}`;
console.log({ BASE_PREFIX_URL });

app.use("/api/v1/employee", employeeRouter);
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
