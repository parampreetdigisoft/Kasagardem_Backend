const express = require("express");
const cors = require("cors");
const errorHandler = require("./core/middleware/errorHandler");

// Import routes
const authRoutes = require("./modules/auth/authRoutes");
const roleRoutes = require("./modules/roles/roleRoutes");
const setupSwagger = require("./swagger");

const app = express();

setupSwagger(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/roles", roleRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running!" });
});

// Error handler (must be last middleware)
app.use(errorHandler);

// 404 handler
app.use(/.*/, (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;
