# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ApnaThikana** is a property management backend for guest houses, hostels, and co-living spaces. It handles the full lifecycle of properties, physical inventory (floors, rooms, beds), tenant onboarding, rent/payments, expenses, complaints, and announcements.

## Commands

```bash
# Development (auto-reload via nodemon + ts-node)
npm run dev

# Build TypeScript to dist/
npm run build

# Run compiled production server
npm start

# Run tests (Jest configured, but no tests exist yet)
npm test
```

## API Architecture Standards

These are strict conventions for mobile client compatibility — do not deviate from them:

- **No path parameters** — `/api/properties/:id` is forbidden
- `GET` requests: IDs via **query params** (`?id=...`)
- `PATCH`, `POST`, `DELETE` requests: IDs via **JSON request body**
- Routes use action verbs: `/api/properties/create-property`, `/api/tenants/get-tenants`
- Standard response shape: `{ success: boolean, data: any, message?: string }`
- Errors thrown in services; caught in controllers and passed to `next(error)`

## Architecture

The stack is **Express + TypeScript + MongoDB (Mongoose)**. Auth is **JWT** (7-day expiry, `Authorization: Bearer` header) with **RBAC** scoped to `propertyId`.

### Request Flow

```
Route (JSDoc Swagger) → Controller (req/res) → Service (business logic + DB) → Mongoose Model
```

### Domain Model Hierarchy

```
Property → Floor → Room → Bed
                           ↓
              PropertyInventoryAllocation (bridges physical space + RoomCategory pricing)
                           ↓
                  TenantAllocation (links Tenant to a specific allocation, tracks rent/deposit/status)
```

- **Physical units** (Floor, Room, Bed) are "loose" — not hard-linked to each other in base schemas. They are formally linked inside `PropertyInventoryAllocation`.
- **RoomCategory** is a pricing/capacity template with `basePrice` and `bedCount`.
- **TenantAllocation** statuses: `active`, `inactive`, `terminated`, `notice`.
- **RBAC**: Roles are property-scoped. `jwtAuth` middleware attaches user context; `authorizeRoles()` / `authorizePermissions()` are middleware factories.

### Key Services

| Service | Responsibility |
|---|---|
| `RentLedgerService` | Payment records, due dates, overdue tracking (largest service) |
| `TenantAllocationService` | Allocation lifecycle, refund calculations, exit/notice handling |
| `PropertyInventoryAllocationService` | Batch allocation creation, bed availability checks |
| `RbacService` | Seeds default roles/permissions/modules; auto-makes first user admin |
| `NotificationService` | OneSignal push notifications |
| `R2Service` | Cloudflare R2 (S3-compatible) file upload/presigned URLs |
| `SmePayService` | SmePay payment gateway integration |

### RBAC Bootstrap

`RbacService.ensureDefaults()` runs on server start and on auth routes. It seeds default permissions, modules, and roles. The first registered user becomes admin; all subsequent users get the `user` role.

## Adding a Field (Workflow)

1. Update the **model** — TypeScript interface and Mongoose schema
2. Update the **service** — creation/update methods
3. Update the **controller** — extract field from `req.body` or `req.query`
4. Update the **route** Swagger JSDoc — ensure correct YAML indentation

## Swagger / API Docs

- Swagger UI is served at the root path on server start
- Use **individual** `/** @swagger ... */` blocks per route — a shared block causes parsing crashes
- Always list all `required` fields in the JSDoc schema

## External Integrations

- **MongoDB Atlas** — `MONGODB_URI` in `.env`
- **OneSignal** — push notifications (tenant alerts, announcements)
- **Cloudflare R2** — document/image storage with presigned URLs
- **SmePay** — payment gateway (token-based API)

## Environment Variables

Required in `.env`:
```
MONGODB_URI
JWT_SECRET
PORT
ONESIGNAL_APP_ID
ONESIGNAL_REST_API_KEY
SMEPAY_*         # payment gateway credentials
R2_*             # Cloudflare R2 credentials
APP_URL
```
