import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./env.config";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Shopster API Documentation",
    version: "1.0.0",
    description:
      "Complete API documentation for Shopster - AI-Powered Ad Generation Platform",
    contact: {
      name: "API Support",
      email: "support@shopster.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: config.server.isDevelopment
        ? `http://localhost:${config.server.port}/api/v1`
        : "https://api.shopster.com/api/v1",
      description: config.server.isDevelopment
        ? "Development Server"
        : "Production Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "refreshToken",
        description: "Refresh token stored in HTTP-only cookie",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Error message",
          },
          errorCode: {
            type: "string",
            example: "ERROR_CODE",
          },
          errors: {
            type: "array",
            items: {
              type: "object",
            },
          },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          total: {
            type: "integer",
            example: 100,
          },
          page: {
            type: "integer",
            example: 1,
          },
          limit: {
            type: "integer",
            example: 10,
          },
          totalPages: {
            type: "integer",
            example: 10,
          },
          hasNextPage: {
            type: "boolean",
            example: true,
          },
          hasPrevPage: {
            type: "boolean",
            example: false,
          },
        },
      },
      ProductInput: {
        type: "object",
        required: ["storeId", "externalId", "title"],
        properties: {
          storeId: { type: "string" },
          categoryId: { type: "string" },
          externalId: { type: "string" },
          sku: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri" },
                alt: { type: "string" },
                position: { type: "integer" },
              },
            },
          },
          variants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                sku: { type: "string" },
                inStock: { type: "boolean" },
                options: { type: "object" },
              },
            },
          },
          isActive: { type: "boolean" },
          inStock: { type: "boolean" },
        },
      },
      ProductUpdateInput: {
        type: "object",
        properties: {
          categoryId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri" },
                alt: { type: "string" },
                position: { type: "integer" },
              },
            },
          },
          variants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                sku: { type: "string" },
                inStock: { type: "boolean" },
                options: { type: "object" },
              },
            },
          },
          isActive: { type: "boolean" },
          inStock: { type: "boolean" },
        },
      },
      TemplateInput: {
        type: "object",
        required: ["name", "slug", "promptTemplate"],
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          promptTemplate: { type: "string" },
          variableIds: { type: "array", items: { type: "string" } },
          categoryIds: { type: "array", items: { type: "string" } },
          referenceAdImage: { type: "string", format: "uri" },
          productImage: { type: "string", format: "uri" },
          isActive: { type: "boolean" },
        },
      },
      TemplateUpdateInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          promptTemplate: { type: "string" },
          variableIds: { type: "array", items: { type: "string" } },
          categoryIds: { type: "array", items: { type: "string" } },
          referenceAdImage: { type: "string", format: "uri" },
          productImage: { type: "string", format: "uri" },
          isActive: { type: "boolean" },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Users", description: "User management endpoints" },
    { name: "Stores", description: "Store integration endpoints" },
    { name: "Products", description: "Product management endpoints" },
    { name: "Categories", description: "Category management endpoints" },
    { name: "Templates", description: "Template management endpoints" },
    { name: "Ads", description: "Ad generation endpoints" },
    { name: "Ad Drafts", description: "Ad draft management endpoints" },
    { name: "Jobs", description: "Generation job endpoints" },
    { name: "Health", description: "Health check endpoints" },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    "./src/modules/**/*.routes.ts",
    "./src/modules/**/*.controller.ts",
    "./src/health/*.routes.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
