import express from "express";
import cors from "cors";
import errorHandler from "./core/middleware/errorHandler";
import setupSwagger from "./swagger";
import path from "path";

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
import healthRoutes from "./modules/health/health";
import ApiService from "./core/services/apiService";
import config from "./core/config/env";
import translationMiddleware from "./core/middleware/translationMiddleware";

const app = express();
setupSwagger(app);

// Create an instance of ApiService for plant identification
export const plantApiService = new ApiService(config.KASAGARDEM_PLANTAPI_URL, {
  "Api-Key": config.KASAGARDEM_PLANTAPI_KEY || "",
  "Content-Type": "application/json",
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
app.use("/api/v1", answerRoutes);
// Add Plants user selected data Routes
app.use("/api/v1", plantRoutes);
// Add Plants user selected data Routes
app.use("/api/v1/stateCityData", stateCityRoutes);

app.use("/", healthRoutes);

//Add this middleware so you can access uploaded files in browser:
// Now if a file is saved as:
// /uploads/plants/abc123.png
// you can open it in browser at:
// http://localhost:8080/uploads/plants/abc123.png
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

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
