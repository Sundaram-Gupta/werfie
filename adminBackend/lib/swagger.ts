import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Werfie Admin API',
            version: '1.0.0',
            description: 'API documentation for the Werfie Admin Panel backend',
        },
        servers: [
            {
                url: 'http://localhost:3012',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./app/api/**/*.ts'], // Path to the API docs
};

export const getApiDocs = () => {
    const spec = swaggerJsdoc(options);
    return spec;
};
