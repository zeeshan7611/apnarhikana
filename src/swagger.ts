import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Apna Thikana API',
    version: '1.0.0',
    description: 'API documentation for Apna Thikana Backend',
  },
  servers: [
    {
      url: '/',
      description: 'Current server',
    },
  ],
};

const apis = [
  path.join(__dirname, './swagger-all-paths.js'),
  path.join(__dirname, './swagger-all-schemas.js'),
];

const swaggerSpec = swaggerJSDoc({ swaggerDefinition, apis });

export default (app: any) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
