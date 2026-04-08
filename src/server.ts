import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import userRoutes from './routes/userRoutes';
import propertyRoutes from './routes/propertyRoutes';
import floorRoutes from './routes/floorRoutes';
import roomRoutes from './routes/roomRoutes';
import allocationRoutes from './routes/allocationRoutes';
import authRoutes from './routes/authRoutes';
import { jwtAuth } from './middleware/jwtAuth';

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

// Routes
app.use('/api/users', jwtAuth, userRoutes);
app.use('/api/properties', jwtAuth, propertyRoutes);
app.use('/api/floors', jwtAuth, floorRoutes);
app.use('/api/rooms', jwtAuth, roomRoutes);
app.use('/api/allocations', jwtAuth, allocationRoutes);

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});