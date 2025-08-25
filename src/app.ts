import express from "express";
import cors from "cors";
import errorHandler from "./core/middleware/errorHandler";
import setupSwagger from "./swagger";
import path from "path";

// Import routes
import authRoutes from "./modules/auth/authRoutes";
import roleRoutes from "./modules/roles/roleRoutes";
import userProfileRoutes from "./modules/userProfile/userProfileRoutes";
import plantDetectionRoutes from "./modules/plants/plantDetection/plantDetectionRoutes";
import plantDiseaseDetectionRoutes from "./modules/plants/diseaseDetection/diseaseDetectionRoutes";
import plantCareInformationRoutes from "./modules/plants/plantCareInformation/plantCareInformationRoutes";
import ApiService from "./core/services/apiService";
import config from "./core/config/env";

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
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
  credentials: true, // Set to true for cookies or HTTP auth
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// USer Authentication Routes
app.use("/api/v1/auth", authRoutes);
// User Role Routes
app.use("/api/v1/roles", roleRoutes);
// User Profile Routes
app.use("/api/v1/userProfile", userProfileRoutes);
// Plant Detection Routes
app.use("/api/v1/plants/plantsDetection", plantDetectionRoutes);
// Plant Disease Detection Routes
app.use("/api/v1/plants/plantDisease", plantDiseaseDetectionRoutes);
// Plant Care Information Routes
app.use("/api/v1/plants/plantInformation", plantCareInformationRoutes);

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
