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
    parameters: {
      AcceptLanguage: {
        in: "header",
        name: "Accept-Language",
        schema: {
          type: "string",
          enum: ["en", "pt"],
          default: "pt",
        },
        required: false,
        description:
          "Language preference for the response (defaults to Portuguese if not specified)",
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
  // Swagger UI options with request interceptor
  const swaggerUiOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      /**
       * Intercepts all Swagger requests to add default Accept-Language header.
       * @param {Record<string, unknown>} req - The request object from Swagger UI
       * @returns {Record<string, unknown>} The modified request object with Accept-Language header
       */
      requestInterceptor: (
        req: Record<string, unknown>
      ): Record<string, unknown> => {
        const headers = req.headers as Record<string, string>;
        // Add Accept-Language header only if not already set
        if (!headers["Accept-Language"]) {
          headers["Accept-Language"] = "pt"; // Default to Portuguese
        }
        return req;
      },
    },
  };
  app.use(
    "/swagger",
    swaggerUi.serve,
    swaggerUi.setup(specs, swaggerUiOptions)
  );
}

export default setupSwagger;
