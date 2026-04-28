import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import propertyUserRoutes from './routes/propertyUserRoutes';
import propertyRoutes from './routes/propertyRoutes';
import floorRoutes from './routes/floorRoutes';
import roomRoutes from './routes/roomRoutes';
import bedRoutes from './routes/bedRoutes';
import allocationRoutes from './routes/propertInventoryAllocationRoutes';
import authRoutes from './routes/authRoutes';
import rbacRoutes from './routes/rbacRoutes';
import moduleRoutes from './routes/moduleRoutes';
import tenantRoutes from './routes/tenantRoutes';
import tenantAllocationRoutes from './routes/tenantAllocationRoutes';
import expenseRoutes from './routes/expenseRoutes';
import complaintRoutes from './routes/complaintRoutes';
import announcementRoutes from './routes/announcementRoutes';
import roomCategoryRoutes from './routes/roomCategoryRoutes';
import paymentRoutes from './routes/paymentRoutes';

import { jwtAuth } from './middleware/jwtAuth';
import RbacService from './services/RbacService';

import setupSwagger from './swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Swagger UI
setupSwagger(app);

// Routes - Protected
app.use('/api/properties', jwtAuth, propertyRoutes);
app.use('/api/floors', jwtAuth, floorRoutes);
app.use('/api/rooms', jwtAuth, roomRoutes);
app.use('/api/beds', jwtAuth, bedRoutes);
app.use('/api/allocations', jwtAuth, allocationRoutes);

// property-users route has a public login endpoint, so jwtAuth is handled internally for protected routes.
app.use('/api/property-users', propertyUserRoutes);

// RBAC routes (Protected)
app.use('/api/rbac', jwtAuth, rbacRoutes);

// Module routes (Protected)
app.use('/api/modules', jwtAuth, moduleRoutes);

// Tenant routes (Protected)
app.use('/api/tenants', jwtAuth, tenantRoutes);

// Tenant Allocation routes (Protected)
app.use('/api/tenant-allocations', jwtAuth, tenantAllocationRoutes);

// Expense routes (Protected)
app.use('/api/expenses', jwtAuth, expenseRoutes);

// Complaint routes (Protected)
app.use('/api/complaints', jwtAuth, complaintRoutes);

// Announcement routes (Protected)
app.use('/api/announcements', jwtAuth, announcementRoutes);

// Room Category routes (Protected)
app.use('/api/room-categories', jwtAuth, roomCategoryRoutes);
app.use('/api/payments', jwtAuth, paymentRoutes);


// Connect to DB and start server
connectDB().then(() => {
  RbacService.ensureDefaults().catch((err) => {
    console.error('RBAC default seed failed:', err);
  });
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});