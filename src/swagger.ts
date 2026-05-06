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
    { name: 'Payments',    description: 'Rent collection and payment tracking' },
    { name: 'RentLedger', description: 'Monthly rent billing, payments, late fees and audit trail' },
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
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          status: { type: 'string', enum: ['open', 'in-progress', 'resolved', 'closed'] },
          sourceApp: { type: 'string', enum: ['tenant', 'propertyManager'] },
          assignedTo: { type: 'string' },
          resolutionNotes: { type: 'string' },
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
          status: { type: 'string', enum: ['active', 'inactive', 'terminated'] },
          notes: { type: 'string' },
          createdById: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          tenantAllocationId: { type: 'string' },
          tenantId: { type: 'string' },
          propertyId: { type: 'string' },
          amount: { type: 'number' },
          month: { type: 'string', description: 'Format: YYYY-MM' },
          paymentMethod: { type: 'string', enum: ['cash', 'upi', 'bank_transfer', 'cheque'] },
          status: { type: 'string', enum: ['pending', 'paid', 'failed', 'partial'] },
          paidAt: { type: 'string', format: 'date-time' },
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
          lateFee:            { type: 'number' },
          totalAmount:        { type: 'number' },
          paidAmount:         { type: 'number' },
          dueDate:            { type: 'string', format: 'date-time' },
          status:             { type: 'string', enum: ['pending', 'partial', 'paid', 'overdue'] },
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
          status:               { type: 'string', enum: ['success', 'failed', 'pending'] },
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
      PaymentLog: {
        type: 'object',
        properties: {
          id:                   { type: 'string' },
          rentLedgerId:         { type: 'string' },
          paymentTransactionId: { type: 'string' },
          action:               { type: 'string', enum: ['ledger_created', 'payment_recorded', 'late_fee_applied', 'status_changed', 'ledger_locked', 'note_added'] },
          previousStatus:       { type: 'string' },
          newStatus:            { type: 'string' },
          description:          { type: 'string' },
          performedById:        { type: 'string' },
          createdAt:            { type: 'string', format: 'date-time' },
          updatedAt:            { type: 'string', format: 'date-time' },
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
          type:       { type: 'string', enum: ['announcement', 'complaint', 'payment', 'allocation'] },
          isRead:     { type: 'boolean' },
          data:       { type: 'object' },
          createdAt:  { type: 'string', format: 'date-time' },
          updatedAt:  { type: 'string', format: 'date-time' },
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
