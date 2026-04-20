# ApnaThikana Backend - Project Context & Documentation

This document serves as the primary context for any AI or developer working on the ApnaThikana Backend. It outlines the architecture, data models, API standards, and core business logic.

---

## 1. Project Overview
**ApnaThikana** is a property management system designed for guest houses, hostels, and co-living spaces. It manages the lifecycle of properties, physical inventory (floors, rooms, beds), tenant onboarding, and financial operations (expenses, complaints, announcements).

### Tech Stack
- **Runtimes**: Node.js, TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Documentation**: Swagger/OpenAPI 3.0 (`swagger-jsdoc`)
- **Authentication**: JWT with RBAC (Role-Based Access Control)

---

## 2. API Architecture Standards
The project follows a strict set of design principles to ensure compatibility with mobile clients (Flutter/React Native):

### Path Parameters
- **NO path parameters** are used (e.g., `/api/properties/:id` is forbidden).
- For `GET` requests, IDs must be passed as **Query Parameters** (`?id=...`).
- For `PATCH`, `POST`, and `DELETE` requests, IDs must be passed in the **JSON Request Body**.

### HTTP Methods
- `GET`: Read operations.
- `POST`: Creation and "complex" actions (like login).
- `PATCH`: ALL update operations (partial updates).
- `DELETE`: Removal operations.

### Action-Based Routing
Routes use explicit action verbs rather than relying solely on HTTP methods:
- `/api/properties/create-property`
- `/api/properties/update-property`
- `/api/tenants/get-tenants`

### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message string"
}
```

---

## 3. Core Domain Models

### Physical Inventory
- **Property**: The top-level entity.
- **Floor**, **Room**, **Bed**: Discrete units.
- **Note**: These units are "loose" in the database (they don't have hard foreign key refs to each other in their base models). They are formally linked together into an "Occupancy Unit" within the `PropertyInventoryAllocation` record.

### Inventory Logic
- **RoomCategory**: A template for pricing and capacity. Includes `roomCategory` (name), `basePrice`, and `bedCount`.
- **PropertyInventoryAllocation**: The bridge between physical space and commercial templates. 
    - Links a specific `Property/Floor/Room/Bed` triplet to a `RoomCategory`.
    - **Batch Creation**: The system can batch-create these allocations by finding the first available `Bed` records (isActive: true and not already in an active allocation) and linking them to a requested `RoomCategory`.

### Tenant Management
- **Tenant**: Personal information, contact details, and joining history.
- **TenantAllocation**: Links a `Tenant` to a specific `PropertyInventoryAllocation`. Tracks rent amount, deposit, start/end dates, and status (`active`, `inactive`, `terminated`).

### Support Modules
- **Expense**: Tracks property-specific financial outgoings.
- **Complaint**: Tenant-raised issues with priority and resolution tracking.
- **Announcement**: OneSignal-integrated notifications sent to Tenants based on Property/Floor/Room filters.

---

## 4. Security & RBAC
- **Authentication**: JWT-based. Middleware `jwtAuth` extracts user context.
- **RBAC (Role-Based Access Control)**: 
    - Roles are **scoped to a `propertyId`**.
    - Permissions are standard strings (`feature:action`).
    - Middleware `authorizePermissions('permission:name')` checks if the authenticated user has a role with that permission for the relevant scope.

---

## 5. Directory Structure
```text
src/
├── config/      # DB and Environment secrets
├── controllers/ # Request handling logic
├── middleware/  # JWT Auth, Permission checks, Error handling
├── models/      # Mongoose schemas (TypeScript interfaces)
├── routes/      # Endpoint definitions + Swagger JSDoc
├── services/    # Business logic & DB interaction (Crucial Section)
├── server.ts    # Entry point
└── swagger.ts   # Documentation setup
```

---

## 6. Development Guidelines for AI
1. **Adding a Field**: 
    - Update the `model` interface and schema.
    - Update the `service` method (creation/update).
    - Update the `controller` to extract the field.
    - Update the `routes` Swagger JSDoc (Crucial: ensure YAML indentation is correct).
2. **Swagger Docs**: 
    - Always use individual `/** @swagger ... */` blocks for each route to prevent parsing crashes.
    - Ensure all `required` fields are listed.
3. **Database**: Use Mongoose ObjectIds for relationships. Avoid raw strings for IDs where possible in logic.
4. **Error Handling**: Throw errors in services; catch them in controllers and pass to `next(error)`.
