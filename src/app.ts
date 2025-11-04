import express from "express";
import cors from "cors";
import errorHandler from "./core/middleware/errorHandler";
import setupSwagger from "./swagger";

// Import routes
import authRoutes from "./modules/auth/authRoutes";
import roleRoutes from "./modules/roles/roleRoutes";
import userProfileRoutes from "./modules/userProfile/userProfileRoutes";
import questionRoutes from "./modules/admin/questions/questionRoutes";
import ruleRoutes from "./modules/admin/rules/ruleRoutes";
import partnerProfileRoutes from "./modules/partnerProfile/partnerProfileRoute";
import answerRoutes from "./modules/answers/answerRoutes";
import plantRoutes from "./modules/plant/plantRoutes";
import stateCityRoutes from "./modules/stateCity/stateCityRoutes";
import leadsRoutes from "./modules/admin/leads/leadsRoute";
import translationMiddleware from "./core/middleware/translationMiddleware";
import { connectDB } from "./core/config/db";
const app = express();
setupSwagger(app);

// Initialize database connection
connectDB().catch((error) => {
  console.error("Failed to connect to database:", error);
  process.exit(1);
});

// Middleware
const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
  exposedHeaders: ["Authorization"],
  credentials: true, // Set to true for cookies or HTTP auth
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(translationMiddleware()); // enable translation globally
// USer Authentication Routes
app.use("/api/v1/auth", authRoutes);
// User Role Routes
app.use("/api/v1/roles", roleRoutes);
// User Profile Routes
app.use("/api/v1/userProfile", userProfileRoutes);
// Admin Question Routes
app.use("/api/v1/admin", questionRoutes);
// Admin Question Rules Routes
app.use("/api/v1/admin", ruleRoutes);
// Partner Profile Routes
app.use("/api/v1/partnerProfile", partnerProfileRoutes);
// Add Question Answer user selected data Routes
app.use("/api/v1/answers", answerRoutes);
// Add Plants user selected data Routes
app.use("/api/v1", plantRoutes);
// State City Country Routes
app.use("/api/v1/stateCityData", stateCityRoutes);
// Leads Routes
app.use("/api/v1/admin", leadsRoutes);

// Error handler (must be last middleware)
app.use(errorHandler);

// 404 handler
app.use(/.*/, (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
