const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const config = require("./core/config/env");

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
        description: "Local server",
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
    "./src/modules/auth/*.js",
    "./src/modules/roles/*.js",
    "./src/modules/userProfile/*.js",
  ],
};

const specs = swaggerJsdoc(options);

/**
 * Configures and mounts the Swagger UI for API documentation.
 * @param {import('express').Application} app - The Express application instance.
 */
function setupSwagger(app) {
  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(specs));
}

module.exports = setupSwagger;
