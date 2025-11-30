const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PulseWatch API",
      version: "1.0.0",
      description:
        "API documentation for PulseWatch - Real-time API Monitoring Dashboard",
      contact: {
        name: "Mohammed",
        url: "https://github.com/hamood268",
        email: "hastreams6@example.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Local development server",
      },
      // Uncomment when you have production server
      // {
      //   url: "https://your-production-url.com",
      //   description: "Production server",
      // },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT token stored in HTTP-only cookie",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "gDmJ4m96Xo2lcSbG",
            },
            username: {
              type: "string",
              example: "mohammed",
            },
            email: {
              type: "string",
              example: "mohammed@example.com",
            },
            role: {
              type: "string",
              example: "User",
            },
          },
        },
        Monitor: {
          type: "object",
          properties: {
            monitorId: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            userId: {
              type: "string",
              example: "gDmJ4m96Xo2lcSbG",
            },
            name: {
              type: "string",
              example: "My API",
            },
            url: {
              type: "string",
              example: "https://api.example.com/health",
            },
            interval: {
              type: "number",
              example: 60,
              description: "Check interval in seconds",
            },
            status: {
              type: "string",
              enum: ["Up", "Down", "Unknown"],
              example: "Up",
            },
            lastCheckedAt: {
              type: "string",
              format: "date-time",
              example: "2025-01-28T12:00:00Z",
            },
            lastResponseTime: {
              type: "number",
              example: 150,
              description: "Response time in milliseconds",
            },
            consecutiveFails: {
              type: "number",
              example: 0,
            },
            history: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["Up", "Down"],
                  },
                  responseTime: {
                    type: "number",
                  },
                  timestamp: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            code: {
              type: "number",
              example: 400,
            },
            status: {
              type: "string",
              example: "Bad Request",
            },
            message: {
              type: "string",
              example: "Validation error",
            },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: [
    path.join(__dirname, "./API/Routes/*.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app) {

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "PulseWatch API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );

}

module.exports = { swaggerDocs };