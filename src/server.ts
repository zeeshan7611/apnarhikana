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

// Connect to DB and start server
connectDB().then(() => {
  RbacService.ensureDefaults().catch((err) => {
    console.error('RBAC default seed failed:', err);
  });
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});