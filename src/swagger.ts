import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Apna Thikana API',
    version: '1.0.0',
    description: 'API documentation for Apna Thikana Backend',
  },
};

const apis = [
  path.join(__dirname, './swagger-all-paths.js'),
  path.join(__dirname, './swagger-all-schemas.js'),
];

const swaggerSpec = swaggerJSDoc({ swaggerDefinition, apis });

export default (app: any) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
