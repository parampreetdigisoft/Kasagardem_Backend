import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";
import config from "./core/config/env";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kasagardem Backend API",
      version: "1.0.0",
      description: "User Authentication REST API documentation",
    },
    servers: [
      {
        url: config.APPDEV_URL,
        description: "Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token here. **'Bearer'**, token.",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/modules/auth/*.ts",
    "./src/modules/roles/*.ts",
    "./src/modules/userProfile/*.ts",
    "./src/modules/admin/questions/*.ts",
    "./src/modules/admin/rules/*.ts",
    "./src/modules/partnerProfile/*.ts",
    "./src/modules/answers/*.ts",
    "./src/modules/plant/*.ts",
    "./src/modules/stateCity/*.ts",
    "./src/modules/health/*.ts",
  ],
};

const specs = swaggerJsdoc(options);

/**
 * Configures and mounts the Swagger UI for API documentation.
 * @param {Application} app - The Express application instance.
 */
function setupSwagger(app: Application): void {
  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(specs));
}

export default setupSwagger;
