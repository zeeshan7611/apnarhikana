# Apna Thikana Backend

A Node.js TypeScript backend for hostel/PG property management with RBAC using Clerk for authentication.

## Features

- User authentication via Clerk
- Role-based access control (admin, manager, user)
- CRUD operations for Properties, Floors (metadata), Rooms, and Allocations

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/apnaThikana
   CLERK_SECRET_KEY=your_clerk_secret_key
   PORT=3000
   ```

3. Start MongoDB.

4. Run the server:
   ```
   npm run dev
   ```

## API Endpoints

### Users
- GET /api/users/profile - Get user profile
- PUT /api/users/roles - Update user roles (admin only)

### Properties
- GET /api/properties - Get all properties
- GET /api/properties/:id - Get property by ID
- POST /api/properties - Create property (manager/admin)
- PUT /api/properties/:id - Update property (manager/admin)
- DELETE /api/properties/:id - Delete property (admin)

### Floors
- GET /api/floors - Get all floors
- GET /api/floors/:id - Get floor by ID
- POST /api/floors - Create floor (manager/admin)
- PUT /api/floors/:id - Update floor (manager/admin)
- DELETE /api/floors/:id - Delete floor (admin)

### Rooms
- GET /api/rooms - Get all rooms
- GET /api/rooms/:id - Get room by ID
- POST /api/rooms - Create room (manager/admin)
- PUT /api/rooms/:id - Update room (manager/admin)
- DELETE /api/rooms/:id - Delete room (admin)

### Allocations
- GET /api/allocations - Get all allocations
- GET /api/allocations/:id - Get allocation by ID
- POST /api/allocations - Create allocation (manager/admin)
- PUT /api/allocations/:id - Update allocation (manager/admin)
- DELETE /api/allocations/:id - Delete allocation (admin)

## RBAC

- **user**: Can view data
- **manager**: Can create/update (except roles)
- **admin**: Full access including delete and role management