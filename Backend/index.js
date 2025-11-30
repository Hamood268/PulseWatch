require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const PORT = process.env.PORT;
const cookieParser = require("cookie-parser");

const { swaggerDocs } = require("./swagger.js");

const { authenticateToken } = require("./Utilities/authenticateToken.js");
const { startSchedulerForMonitor } = require("./Utilities/monitorScheduler.js");

const { MonitorsModel } = require("./Database/Schemas/monitorsSchema.js");

const app = express();

const { connectDB } = require("./Database/database.js");
connectDB();

MonitorsModel.find({})
  .then((allMonitors) => {
    allMonitors.forEach((m) => startSchedulerForMonitor(m));
  })
  .catch((err) => console.log(err));

const authRoutes = require("./API/Routes/authentication.js");
const monitorRoutes = require("./API/Routes/endpointMonitors.js");

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "../Frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

app.get("/dashboard", authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/dashboard.html"));
});

app.get("/profile", authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/profile.html"));
});

app.get("/api/admin/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/monitors", monitorRoutes);

swaggerDocs(app);


// Wrong endpoint handler
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    status: "Not Found",
    message:
      "This endpoint doesn't exist, Visit /api/docs for API documentation.",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    code: 500,
    status: "Internal Server Error",
    message: "Something went wrong",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
