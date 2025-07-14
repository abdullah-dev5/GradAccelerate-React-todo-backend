import swaggerJSDoc from 'swagger-jsdoc';
import { API } from './constants.js';

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'GradTrack Todo API',
        version: API.VERSION,
        description: 'API for managing tasks in GradTrack application',
        contact: {
            name: 'API Support',
            email: 'support@gradtrack.com'
        }
    },
    servers: [
        {
            url: `http://localhost:4000${API.BASE_PATH}`,  // Changed here
            description: 'Development server'
        },
        {
            url: `https://api.gradtrack.com${API.BASE_PATH}`,  // Changed here
            description: 'Production server'
        }

    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            Task: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'clxyz123' },
                    title: { type: 'string', example: 'Complete project' },
                    status: {
                        type: 'string',
                        enum: ['todo', 'inProgress', 'done'],
                        example: 'todo'
                    },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high'],
                        example: 'medium'
                    },
                    dueDate: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true,
                        example: '2024-12-31T00:00:00Z'
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            TaskInput: {
                type: 'object',
                required: ['title'],
                properties: {
                    title: { type: 'string', example: 'New task' },
                    status: {
                        type: 'string',
                        enum: ['todo', 'inProgress', 'done'],
                        default: 'todo'
                    },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high'],
                        default: 'medium'
                    },
                    dueDate: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true
                    }
                }
            },
            Pagination: {
                type: 'object',
                properties: {
                    total: { type: 'integer', example: 100 },
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 10 },
                    totalPages: { type: 'integer', example: 10 }
                }
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Validation error' },
                    details: {
                        type: 'string',
                        nullable: true,
                        example: 'Title is required'
                    }
                }
            }
        }
    }
};

const options = {
    swaggerDefinition,
    apis: [
        './src/routes/*.js',
        './src/controllers/*.js'
    ]
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;