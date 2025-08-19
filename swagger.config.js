/**
 * API DOCUMENTATION CONFIGURATION
 * Automatic OpenAPI/Swagger generation with strict validation
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Medical Devices Marketplace API',
      version: '1.0.0',
      description: 'Production-ready API for medical devices marketplace',
      termsOfService: 'https://api.medical-devices.com/terms',
      contact: {
        name: 'API Support',
        url: 'https://api.medical-devices.com/support',
        email: 'api@medical-devices.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://api.medical-devices.com/license'
      }
    },
    servers: [
      {
        url: 'https://api.medical-devices.com/v1',
        description: 'Production server'
      },
      {
        url: 'https://staging-api.medical-devices.com/v1',
        description: 'Staging server'
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication token'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for service-to-service communication'
        },
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://auth.medical-devices.com/oauth/authorize',
              tokenUrl: 'https://auth.medical-devices.com/oauth/token',
              scopes: {
                read: 'Read access',
                write: 'Write access',
                admin: 'Admin access'
              }
            }
          }
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: {
              type: 'string',
              description: 'Error code',
              example: 'VALIDATION_ERROR'
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            path: {
              type: 'string'
            },
            requestId: {
              type: 'string'
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            },
            hasNext: {
              type: 'boolean',
              description: 'Has next page'
            },
            hasPrevious: {
              type: 'boolean',
              description: 'Has previous page'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Conflict: {
          description: 'Conflict',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        UnprocessableEntity: {
          description: 'Unprocessable entity',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        TooManyRequests: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          },
          headers: {
            'X-RateLimit-Limit': {
              description: 'Request limit per window',
              schema: {
                type: 'integer'
              }
            },
            'X-RateLimit-Remaining': {
              description: 'Remaining requests in window',
              schema: {
                type: 'integer'
              }
            },
            'X-RateLimit-Reset': {
              description: 'Time when rate limit resets',
              schema: {
                type: 'integer'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          }
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field and order',
          required: false,
          schema: {
            type: 'string',
            pattern: '^[a-zA-Z_]+:(asc|desc)$',
            example: 'createdAt:desc'
          }
        },
        FilterParam: {
          name: 'filter',
          in: 'query',
          description: 'Filter criteria',
          required: false,
          schema: {
            type: 'string',
            example: 'status:active,type:supplier'
          }
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Search query',
          required: false,
          schema: {
            type: 'string',
            minLength: 3,
            maxLength: 100
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Products',
        description: 'Product management endpoints'
      },
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ],
    externalDocs: {
      description: 'API Documentation',
      url: 'https://docs.medical-devices.com/api'
    }
  },
  apis: [
    './app/api/**/*.ts',
    './app/api/**/*.js',
    './server/routes/**/*.ts',
    './server/routes/**/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

// Validation function
function validateSwaggerSpec(spec) {
  const errors = [];
  
  // Check for required fields
  if (!spec.info || !spec.info.title || !spec.info.version) {
    errors.push('Missing required info fields');
  }
  
  // Check for servers
  if (!spec.servers || spec.servers.length === 0) {
    errors.push('No servers defined');
  }
  
  // Check for security schemes
  if (!spec.components || !spec.components.securitySchemes) {
    errors.push('No security schemes defined');
  }
  
  // Check for paths
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    errors.push('No API paths defined');
  }
  
  // Validate each path
  if (spec.paths) {
    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
        // Check for operation ID
        if (!operation.operationId) {
          errors.push(`Missing operationId for ${method.toUpperCase()} ${path}`);
        }
        
        // Check for responses
        if (!operation.responses || Object.keys(operation.responses).length === 0) {
          errors.push(`No responses defined for ${method.toUpperCase()} ${path}`);
        }
        
        // Check for description
        if (!operation.description && !operation.summary) {
          errors.push(`No description for ${method.toUpperCase()} ${path}`);
        }
        
        // Check for tags
        if (!operation.tags || operation.tags.length === 0) {
          errors.push(`No tags for ${method.toUpperCase()} ${path}`);
        }
      });
    });
  }
  
  return errors;
}

// Export configuration and spec
module.exports = {
  swaggerSpec,
  validateSwaggerSpec,
  options
};

// Auto-generate TypeScript types from OpenAPI spec
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  
  // Validate spec
  const errors = validateSwaggerSpec(swaggerSpec);
  
  if (errors.length > 0) {
    console.error('Swagger specification validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  // Write spec to file
  const outputPath = path.join(__dirname, 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
  console.log(`OpenAPI specification written to ${outputPath}`);
  
  // Generate TypeScript types
  console.log('Generating TypeScript types from OpenAPI spec...');
  require('child_process').execSync(
    `npx openapi-typescript ${outputPath} --output ${path.join(__dirname, 'types', 'api.d.ts')}`,
    { stdio: 'inherit' }
  );
}