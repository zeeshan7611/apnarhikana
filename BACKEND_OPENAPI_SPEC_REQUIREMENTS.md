# Backend OpenAPI Spec — Required Changes

This document outlines what needs to be added to the Swagger/OpenAPI spec so the frontend
can auto-generate fully-typed API clients. Currently all response types resolve to `unknown`
because response schemas are not defined.

---

## Status of Current Spec

| Item | Status |
|------|--------|
| Tags defined per route group | ✅ Done |
| Request body schemas defined | ✅ Done |
| `components/schemas` (reusable models) | ❌ Missing |
| Response `content` + schema on every endpoint | ❌ Missing |
| Payments module (`/api/payments/`) | ❌ Missing entirely |

---

## Change 1 — Add `components/schemas`

Add the following block to the root of `swagger.json` under `components`:

```json
"components": {
  "securitySchemes": {
    "bearerAuth": { "type": "http", "scheme": "bearer", "bearerFormat": "JWT" }
  },
  "schemas": {

    "Property": {
      "type": "object",
      "properties": {
        "id":          { "type": "string" },
        "name":        { "type": "string" },
        "address":     { "type": "string" },
        "description": { "type": "string" },
        "createdAt":   { "type": "string", "format": "date-time" },
        "updatedAt":   { "type": "string", "format": "date-time" }
      }
    },

    "Tenant": {
      "type": "object",
      "properties": {
        "id":                     { "type": "string" },
        "fullName":               { "type": "string" },
        "phoneNumber":            { "type": "string" },
        "email":                  { "type": "string" },
        "joiningDate":            { "type": "string", "format": "date" },
        "alternateNumber":        { "type": "string" },
        "emergencyContactNumber": { "type": "string" },
        "homeContactNumber":      { "type": "string" },
        "createdAt":              { "type": "string", "format": "date-time" }
      }
    },

    "Floor": {
      "type": "object",
      "properties": {
        "id":       { "type": "string" },
        "name":     { "type": "string" },
        "isActive": { "type": "boolean" }
      }
    },

    "Room": {
      "type": "object",
      "properties": {
        "id":       { "type": "string" },
        "name":     { "type": "string" },
        "roomCode": { "type": "string" },
        "isActive": { "type": "boolean" }
      }
    },

    "Bed": {
      "type": "object",
      "properties": {
        "id":       { "type": "string" },
        "name":     { "type": "string" },
        "isActive": { "type": "boolean" }
      }
    },

    "Complaint": {
      "type": "object",
      "properties": {
        "id":              { "type": "string" },
        "tenantId":        { "type": "string" },
        "propertyId":      { "type": "string" },
        "category":        { "type": "string" },
        "title":           { "type": "string" },
        "description":     { "type": "string" },
        "priority":        { "type": "string", "enum": ["low", "medium", "high", "urgent"] },
        "status":          { "type": "string", "enum": ["open", "in-progress", "resolved", "closed"] },
        "sourceApp":       { "type": "string", "enum": ["tenant", "propertyManager"] },
        "assignedTo":      { "type": "string" },
        "resolutionNotes": { "type": "string" },
        "createdAt":       { "type": "string", "format": "date-time" }
      }
    },

    "Expense": {
      "type": "object",
      "properties": {
        "id":                 { "type": "string" },
        "title":              { "type": "string" },
        "description":        { "type": "string" },
        "amount":             { "type": "number" },
        "category":           { "type": "string" },
        "date":               { "type": "string", "format": "date" },
        "uploadBillImageUrl": { "type": "string" },
        "propertyId":         { "type": "string" },
        "paymentMethod":      { "type": "string" },
        "status":             { "type": "string", "enum": ["pending", "approved", "rejected"] },
        "createdAt":          { "type": "string", "format": "date-time" }
      }
    },

    "InventoryAllocation": {
      "type": "object",
      "properties": {
        "id":           { "type": "string" },
        "propertyId":   { "type": "string" },
        "floorId":      { "type": "string" },
        "roomId":       { "type": "string" },
        "beds":         { "type": "string" },
        "BedBasePrice": { "type": "number" },
        "notes":        { "type": "string" },
        "status":       { "type": "string", "enum": ["active", "inactive", "terminated"] }
      }
    },

    "TenantAllocation": {
      "type": "object",
      "properties": {
        "id":                    { "type": "string" },
        "tenantId":              { "type": "string" },
        "inventoryAllocationId": { "type": "string" },
        "rentAmount":            { "type": "number" },
        "depositAmount":         { "type": "number" },
        "startDate":             { "type": "string", "format": "date" },
        "endDate":               { "type": "string", "format": "date" },
        "status":                { "type": "string", "enum": ["active", "inactive", "terminated", "notice"] },
        "notes":                 { "type": "string" }
      }
    },

    "Payment": {
      "type": "object",
      "properties": {
        "id":                 { "type": "string" },
        "tenantAllocationId": { "type": "string" },
        "tenantId":           { "type": "string" },
        "propertyId":         { "type": "string" },
        "amount":             { "type": "number" },
        "month":              { "type": "string", "description": "Format: YYYY-MM, e.g. 2025-04" },
        "paymentMethod":      { "type": "string", "enum": ["cash", "upi", "bank_transfer", "cheque"] },
        "status":             { "type": "string", "enum": ["pending", "paid", "failed", "partial"] },
        "paidAt":             { "type": "string", "format": "date-time" },
        "notes":              { "type": "string" },
        "createdAt":          { "type": "string", "format": "date-time" }
      }
    },

    "Role": {
      "type": "object",
      "properties": {
        "id":            { "type": "string" },
        "name":          { "type": "string" },
        "description":   { "type": "string" },
        "permissionIds": { "type": "array", "items": { "type": "string" } }
      }
    },

    "Permission": {
      "type": "object",
      "properties": {
        "id":        { "type": "string" },
        "featureId": { "type": "string" },
        "action":    { "type": "string" }
      }
    },

    "Feature": {
      "type": "object",
      "properties": {
        "id":          { "type": "string" },
        "name":        { "type": "string" },
        "key":         { "type": "string" },
        "description": { "type": "string" }
      }
    },

    "PropertyUser": {
      "type": "object",
      "properties": {
        "id":      { "type": "string" },
        "name":    { "type": "string" },
        "email":   { "type": "string" },
        "roleIds": { "type": "array", "items": { "type": "string" } }
      }
    },

    "Announcement": {
      "type": "object",
      "properties": {
        "id":         { "type": "string" },
        "title":      { "type": "string" },
        "message":    { "type": "string" },
        "type":       { "type": "string", "enum": ["announcement", "notification", "emergency"] },
        "tenantId":   { "type": "string" },
        "propertyId": { "type": "string" },
        "floorId":    { "type": "string" },
        "roomId":     { "type": "string" },
        "createdAt":  { "type": "string", "format": "date-time" }
      }
    }

  }
}
```

---

## Change 2 — Add response `content` to every endpoint

Every response currently only has a `description`. A `content` block with the schema must be added.

### Pattern for a single-object response
```json
"200": {
  "description": "Property details",
  "content": {
    "application/json": {
      "schema": { "$ref": "#/components/schemas/Property" }
    }
  }
}
```

### Pattern for a list response
```json
"200": {
  "description": "List of properties",
  "content": {
    "application/json": {
      "schema": {
        "type": "array",
        "items": { "$ref": "#/components/schemas/Property" }
      }
    }
  }
}
```

### All endpoints that need updating

| Route | Method | Response Status | Schema to use |
|-------|--------|-----------------|---------------|
| `/api/properties` | GET | 200 | array of `Property` |
| `/api/properties` | POST | 201 | `Property` |
| `/api/properties/{id}` | GET | 200 | `Property` |
| `/api/properties/{id}` | PUT | 200 | `Property` |
| `/api/tenants/get-tenants` | GET | 200 | array of `Tenant` |
| `/api/tenants/create-tenant` | POST | 201 | `Tenant` |
| `/api/tenants/get-tenant` | GET | 200 | `Tenant` |
| `/api/tenants/update-tenant` | PUT | 200 | `Tenant` |
| `/api/floors/get-floors` | GET | 200 | array of `Floor` |
| `/api/floors/create-floor` | POST | 201 | `Floor` |
| `/api/floors/get-floor` | GET | 200 | `Floor` |
| `/api/floors/update-floor` | PUT | 200 | `Floor` |
| `/api/rooms/get-rooms` | GET | 200 | array of `Room` |
| `/api/rooms/create-room` | POST | 201 | `Room` |
| `/api/rooms/get-room` | GET | 200 | `Room` |
| `/api/rooms/update-room` | PUT | 200 | `Room` |
| `/api/beds/get-beds` | GET | 200 | array of `Bed` |
| `/api/beds/create-bed` | POST | 201 | `Bed` |
| `/api/beds/get-bed` | GET | 200 | `Bed` |
| `/api/beds/update-bed` | PUT | 200 | `Bed` |
| `/api/complaints/get-complaints` | GET | 200 | array of `Complaint` |
| `/api/complaints/create-complaint` | POST | 201 | `Complaint` |
| `/api/complaints/get-complaint` | GET | 200 | `Complaint` |
| `/api/complaints/update-complaint` | PUT | 200 | `Complaint` |
| `/api/expenses/get-expenses` | GET | 200 | array of `Expense` |
| `/api/expenses/create-expense` | POST | 201 | `Expense` |
| `/api/expenses/get-expense` | GET | 200 | `Expense` |
| `/api/expenses/update-expense` | PUT | 200 | `Expense` |
| `/api/allocations/get-allocations` | GET | 200 | array of `InventoryAllocation` |
| `/api/allocations/create-allocation` | POST | 201 | `InventoryAllocation` |
| `/api/allocations/get-allocation` | GET | 200 | `InventoryAllocation` |
| `/api/allocations/update-allocation` | PUT | 200 | `InventoryAllocation` |
| `/api/tenant-allocations/get-allocations` | GET | 200 | array of `TenantAllocation` |
| `/api/tenant-allocations/create-allocation` | POST | 201 | `TenantAllocation` |
| `/api/tenant-allocations/get-allocation` | GET | 200 | `TenantAllocation` |
| `/api/tenant-allocations/update-allocation` | PUT | 200 | `TenantAllocation` |
| `/api/announcements/get-announcements` | GET | 200 | array of `Announcement` |
| `/api/property-users/get-property-users` | GET | 200 | array of `PropertyUser` |
| `/api/property-users/create-property-user` | POST | 201 | `PropertyUser` |
| `/api/property-users/get-property-user` | GET | 200 | `PropertyUser` |
| `/api/property-users/update-property-user` | PUT | 200 | `PropertyUser` |
| `/api/rbac/get-roles` | GET | 200 | array of `Role` |
| `/api/rbac/create-role` | POST | 201 | `Role` |
| `/api/rbac/update-role` | PUT | 200 | `Role` |
| `/api/rbac/get-permissions` | GET | 200 | array of `Permission` |
| `/api/features/get-features` | GET | 200 | array of `Feature` |
| `/api/features/create-feature` | POST | 201 | `Feature` |
| `/api/features/update-feature` | PUT | 200 | `Feature` |

---

## Change 3 — Add Payments module (currently missing)

Add the following routes under the `Payments` tag:

```json
"/api/payments/collect-rent": {
  "post": {
    "summary": "Record a rent payment for a tenant",
    "tags": ["Payments"],
    "security": [{ "bearerAuth": [] }],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "required": ["tenantAllocationId", "amount", "month", "paymentMethod"],
            "properties": {
              "tenantAllocationId": { "type": "string" },
              "tenantId":           { "type": "string" },
              "propertyId":         { "type": "string" },
              "amount":             { "type": "number" },
              "month":              { "type": "string", "description": "Format: YYYY-MM" },
              "paymentMethod":      { "type": "string", "enum": ["cash", "upi", "bank_transfer", "cheque"] },
              "notes":              { "type": "string" }
            }
          }
        }
      }
    },
    "responses": {
      "201": {
        "description": "Payment recorded",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Payment" }
          }
        }
      }
    }
  }
},

"/api/payments/get-payments": {
  "get": {
    "summary": "Get all payments with optional filters",
    "tags": ["Payments"],
    "security": [{ "bearerAuth": [] }],
    "parameters": [
      { "in": "query", "name": "tenantId",   "schema": { "type": "string" } },
      { "in": "query", "name": "propertyId", "schema": { "type": "string" } },
      { "in": "query", "name": "status",     "schema": { "type": "string" } },
      { "in": "query", "name": "month",      "schema": { "type": "string" }, "description": "Format: YYYY-MM" }
    ],
    "responses": {
      "200": {
        "description": "List of payments",
        "content": {
          "application/json": {
            "schema": {
              "type": "array",
              "items": { "$ref": "#/components/schemas/Payment" }
            }
          }
        }
      }
    }
  }
},

"/api/payments/get-payment": {
  "get": {
    "summary": "Get payment by ID",
    "tags": ["Payments"],
    "security": [{ "bearerAuth": [] }],
    "parameters": [
      { "in": "query", "name": "id", "required": true, "schema": { "type": "string" } }
    ],
    "responses": {
      "200": {
        "description": "Payment details",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Payment" }
          }
        }
      },
      "404": { "description": "Payment not found" }
    }
  }
},

"/api/payments/update-payment": {
  "put": {
    "summary": "Update payment status",
    "tags": ["Payments"],
    "security": [{ "bearerAuth": [] }],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "required": ["id"],
            "properties": {
              "id":            { "type": "string" },
              "status":        { "type": "string", "enum": ["pending", "paid", "failed", "partial"] },
              "paymentMethod": { "type": "string", "enum": ["cash", "upi", "bank_transfer", "cheque"] },
              "notes":         { "type": "string" }
            }
          }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Payment updated",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Payment" }
          }
        }
      }
    }
  }
}
```

Also add to the `tags` array at the bottom of the spec:
```json
{ "name": "Payments", "description": "Rent collection and payment tracking" }
```

---

## Why This Matters

Once these changes are live, the frontend runs:

```bash
npm run generate:api
```

And gets fully typed API calls automatically — no manual type writing, no `unknown` types, no guessing response shapes.
