const express = require("express");
const cors = require("cors");
const errorHandler = require("./core/middleware/errorHandler");
const setupSwagger = require("./swagger");

// Import routes
const authRoutes = require("./modules/auth/authRoutes");
const roleRoutes = require("./modules/roles/roleRoutes");
const userProfileRoutes = require("./modules/userProfile/userProfileRoutes");

const app = express();

setupSwagger(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/profiles", userProfileRoutes);

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
