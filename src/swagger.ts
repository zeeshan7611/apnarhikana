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
  tags: [
    { name: 'RentLedger', description: 'Monthly rent billing, payments, and extra charges' },
    { name: 'TenantApp', description: 'APIs for Tenant Mobile Application' },
    { name: 'Auth', description: 'User authentication and role management' },
    { name: 'Payments', description: 'Rent collection and payment tracking' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Property: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          address: { type: 'string' },
          location: { type: 'string' },
          numberOfFloors: { type: 'number' },
          numberOfRooms: { type: 'number' },
          description: { type: 'string' },
          amenities: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Tenant: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fullName: { type: 'string' },
          phoneNumber: { type: 'string' },
          email: { type: 'string' },
          joiningDate: { type: 'string', format: 'date-time' },
          alternateNumber: { type: 'string' },
          emergencyContactNumber: { type: 'string' },
          homeContactNumber: { type: 'string' },
          kyc: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['pending', 'uploaded', 'approved', 'rejected'] },
              rejectionReason: { type: 'string' },
              docType: { type: 'string' },
              submittedAt: { type: 'string' },
              adharCard: {
                type: 'object',
                properties: {
                  adharCardFront: { type: 'string' },
                  adharCardBack: { type: 'string' }
                }
              },
              panCard: {
                type: 'object',
                properties: {
                  panCardFront: { type: 'string' }
                }
              },
              drivingLicence: {
                type: 'object',
                properties: {
                  drivingLicenceFront: { type: 'string' },
                  drivingLicenceBack: { type: 'string' }
                }
              },
              otherDocument: {
                type: 'object',
                properties: {
                  documentUrl: { type: 'string' }
                }
              }
            }
          },
          createdById: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Floor: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          keyNumber: { type: 'number' },
          isActive: { type: 'boolean' },
        },
      },
      Room: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          roomCode: { type: 'string' },
          keyNumber: { type: 'number' },
          isActive: { type: 'boolean' },
        },
      },
      Bed: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          keyNumber: { type: 'number' },
          isActive: { type: 'boolean' },
        },
      },
      RoomCategory: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          roomCategory: { type: 'string' },
          propertyId: { type: 'string' },
          basePrice: { type: 'number' },
          bedCount: { type: 'number' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Complaint: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          propertyId: { type: 'string' },
          category: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          imageUrl: { type: 'string' },
          resolutionURI: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          status: { type: 'string', enum: ['open', 'in-progress', 'resolved', 'closed'] },
          sourceApp: { type: 'string', enum: ['tenant', 'propertyManager', 'landlord'] },
          assignedTo: { type: 'string' },
          resolutionNotes: { type: 'string' },
          type: { type: 'string', enum: ['self', 'tenant'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Expense: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'number' },
          category: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          uploadBillImageUrl: { type: 'string' },
          imageUrl: { type: 'string' },
          userId: { type: 'string' },
          propertyId: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          paymentMethod: { type: 'string' },
          paidBy: { type: 'string' },
          paidTo: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PropertyInventoryAllocation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          propertyId: { type: 'string' },
          floorId: { type: 'string' },
          roomId: { type: 'string' },
          bedId: { type: 'string' },
          roomCategoryId: { type: 'string' },
          notes: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'terminated'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TenantAllocation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          inventoryAllocationId: { type: 'string' },
          rentAmount: { type: 'number' },
          depositAmount: { type: 'number' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['active', 'inactive', 'terminated', 'notice'] },
          notes: { type: 'string' },
          createdById: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Role: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          permissionIds: { type: 'array', items: { type: 'string' } },
        },
      },
      Permission: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          moduleId: { type: 'string' },
          actions: { type: 'array', items: { type: 'string' } },
        },
      },
      Module: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          key: { type: 'string' },
          description: { type: 'string' },
        },
      },
      PropertyUser: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          roleIds: { type: 'array', items: { type: 'string' } },
          phoneNumber: { type: 'string' },
          education: { type: 'string' },
          designation: { type: 'string' },
          joiningDate: { type: 'string', format: 'date-time' },
          monthlySalary: { type: 'number' },
          kycDocument: {
            type: 'object',
            properties: {
              adharCard: { type: 'string' },
              panCard: { type: 'string' },
              drivingLicense: { type: 'string' },
            },
          },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Announcement: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string' },
          imageUrl: { type: 'string' },
          type: { type: 'string', enum: ['announcement', 'notification', 'emergency'] },
          tenantId: { type: 'string' },
          propertyId: { type: 'string' },
          floorId: { type: 'string' },
          roomId: { type: 'string' },
          sentBy: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RentLedger: {
        type: 'object',
        properties: {
          id:                 { type: 'string' },
          tenantId:           { type: 'string' },
          propertyId:         { type: 'string' },
          tenantAllocationId: { type: 'string' },
          month:              { type: 'string', description: 'Format: YYYY-MM', example: '2025-05' },
          rentAmount:         { type: 'number' },
          extraChargesAmount: { type: 'number' },
          extraCharges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                type: { type: 'string', enum: ['electricity', 'water', 'maintenance', 'other'] },
                amount: { type: 'number' },
                description: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          },
          totalAmount:        { type: 'number' },
          paidAmount:         { type: 'number' },
          pendingAmount:      { type: 'number' },
          dueDate:            { type: 'string', format: 'date-time' },
          status:             { type: 'string', enum: ['pending', 'partial', 'paid', 'overdue', 'due'] },
          isLocked:           { type: 'boolean' },
          createdAt:          { type: 'string', format: 'date-time' },
          updatedAt:          { type: 'string', format: 'date-time' },
        },
      },
      PaymentTransaction: {
        type: 'object',
        properties: {
          id:                   { type: 'string' },
          rentLedgerId:         { type: 'string' },
          tenantId:             { type: 'string' },
          propertyId:           { type: 'string' },
          amount:               { type: 'number' },
          paymentMethod:        { type: 'string', enum: ['cash', 'upi', 'bank_transfer', 'cheque'] },
          status:               { type: 'string', enum: ['pending', 'partial', 'paid', 'overdue', 'due'] },
          paymentType:          { type: 'string', enum: ['rent', 'deposit', 'extra_charge'] },
          referenceNumber:      { type: 'string' },
          utrNumber:            { type: 'string', description: 'UTR number for UPI / bank transfers' },
          paymentScreenshotUrl: { type: 'string', description: 'URL of uploaded payment screenshot' },
          notes:                { type: 'string' },
          paidAt:               { type: 'string', format: 'date-time' },
          createdById:          { type: 'string' },
          createdAt:            { type: 'string', format: 'date-time' },
          updatedAt:            { type: 'string', format: 'date-time' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id:                 { type: 'string' },
          tenantAllocationId: { type: 'string' },
          tenantId:           { type: 'string' },
          propertyId:         { type: 'string' },
          amount:             { type: 'number' },
          month:              { type: 'string', description: 'Format: YYYY-MM', example: '2025-04' },
          paymentMethod:      { type: 'string', enum: ['cash', 'upi', 'bank_transfer', 'cheque'] },
          status:             { type: 'string', enum: ['pending', 'paid', 'failed', 'partial'] },
          paidAt:             { type: 'string', format: 'date-time' },
          notes:              { type: 'string' },
          createdAt:          { type: 'string', format: 'date-time' },
          updatedAt:          { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id:         { type: 'string' },
          tenantId:   { type: 'string' },
          propertyId: { type: 'string' },
          title:      { type: 'string' },
          message:    { type: 'string' },
          type:       { type: 'string', enum: ['announcement', 'complaint', 'payment', 'allocation', 'kyc'] },
          isRead:     { type: 'boolean' },
          data:       { type: 'object' },
          createdAt:  { type: 'string', format: 'date-time' },
          updatedAt:  { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/payments/collect-rent': {
      post: {
        summary: 'Record a rent payment for a tenant',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tenantAllocationId', 'amount', 'month', 'paymentMethod'],
                properties: {
                  tenantAllocationId: { type: 'string' },
                  tenantId: { type: 'string' },
                  propertyId: { type: 'string' },
                  amount: { type: 'number' },
                  month: { type: 'string', description: 'Format: YYYY-MM' },
                  paymentMethod: { type: 'string', enum: ['cash', 'upi', 'bank_transfer', 'cheque'] },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Payment recorded',
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/Payment' },
              },
            },
          },
        },
      },
    },
    '/api/payments/get-payments': {
      get: {
        summary: 'Get all payments with optional filters',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'tenantId', schema: { type: 'string' } },
          { in: 'query', name: 'propertyId', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'month', schema: { type: 'string' }, description: 'Format: YYYY-MM' },
        ],
        responses: {
          '200': {
            description: 'List of payments',
            content: {
              'application/json': {
                schema: { type: 'array', items: { '$ref': '#/components/schemas/Payment' } },
              },
            },
          },
        },
      },
    },
    '/api/payments/get-payment': {
      get: {
        summary: 'Get payment by ID',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Payment details',
            content: {
              'application/json': { schema: { '$ref': '#/components/schemas/Payment' } },
            },
          },
          '404': { description: 'Payment not found' },
        },
      },
    },
    '/api/payments/update-payment': {
      put: {
        summary: 'Update payment status',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string', enum: ['pending', 'paid', 'failed', 'partial'] },
                  paymentMethod: { type: 'string', enum: ['cash', 'upi', 'bank_transfer', 'cheque'] },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Payment updated',
            content: {
              'application/json': { schema: { '$ref': '#/components/schemas/Payment' } },
            },
          },
        },
      },
    },
  },
};

const apis = [
  path.join(__dirname, './routes/*.{ts,js}'),
];

const swaggerSpec = swaggerJSDoc({ swaggerDefinition, apis });

export default (app: any) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/swagger.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
