# Your Delivery Backend — Frontend API Guide

This guide describes the HTTP API as it is implemented in this repository. It is intended to be sufficient for a frontend developer to integrate the customer, agent, administrator, and payment flows without reading the backend source.

> **Important implementation notes**
>
> - CORS is configured using the `CORS_ORIGINS` environment variable. Add the exact browser origin(s) used by the frontend to the backend environment, then restart/redeploy the backend. Requests without an `Origin` header (such as typical server-to-server/Postman requests) are allowed.
> - The actual health endpoint is `/api/health` (not `/api/v1/health`).
> - Some mutation handlers do not invoke their defined Zod schemas. Validate all request data in the frontend, and do not rely on the backend to reject every malformed body.

## 1. Environments and base URL

The API prefix is `/api/v1`.

| Environment | Base URL |
|---|---|
| Local development (default port) | `http://localhost:5000/api/v1` |
| Production (listed in the project README; confirm deployment availability) | `https://your-delivery.onrender.com/api/v1` |

The root endpoint is `GET /`. The database health endpoint is `GET /api/health`; it is outside the `/api/v1` prefix.

For JSON requests and responses, send:

```http
Content-Type: application/json
Accept: application/json
```

No version header is required. All authenticated endpoints require a bearer access token:

```http
Authorization: Bearer <accessToken>
```

Use the **access token**, not the refresh token, in this header. Do not send bearer tokens to public routes.

## 2. Roles and authentication

Roles are `CUSTOMER`, `AGENT`, and `ADMIN`. Public registration creates a `CUSTOMER`. Agent and admin accounts must be provisioned by an administrator; registration does not accept a role.

### Login and token lifecycle

1. Register, or log in with an existing account.
2. Store `data.accessToken` for authenticated API calls and `data.refreshToken` for refreshing the access token.
3. On an access-token failure, call `POST /auth/refresh-token` with the refresh token and replace the stored access token.
4. On logout, call `POST /auth/logout` with the refresh token and clear both tokens in the client.

Access tokens are JWTs containing `userId`, `email`, and `role`. Their expiry depends on `JWT_ACCESS_EXPIRES_IN`; that variable is not listed in `.env.example`, so the frontend should treat the configured expiry as deployment-specific. Refresh tokens are random opaque strings, expire after seven days, and are stored hashed by the backend. Refreshing issues a new access token but does **not** rotate the refresh token.

Changing a password does not log the user out or revoke their existing refresh tokens in the current implementation. An inactive user cannot log in or refresh a token, but already-issued access tokens are not checked against the database on each request and may remain usable until they expire. Likewise, a role change may not affect an existing JWT until the client obtains a new access token.

### Authentication endpoints

#### `POST /auth/register` — public

Creates a customer account. Email is normalized to lowercase. Name must be 2–50 characters; password 8–100 characters; phone 10–15 characters.

Request:

```json
{
  "name": "Taylor Example",
  "email": "taylor@example.com",
  "password": "correct-horse-battery",
  "phone": "+15551234567"
}
```

Success: `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "name": "Taylor Example",
    "email": "taylor@example.com",
    "phone": "+15551234567",
    "role": "CUSTOMER",
    "isActive": true,
    "createdAt": "2026-10-03T00:00:00.000Z"
  }
}
```

Registration does not log the customer in or return tokens; call login next. Duplicate email or phone returns `409`.

#### `POST /auth/login` — public

Request:

```json
{ "email": "taylor@example.com", "password": "correct-horse-battery" }
```

Success: `200 OK`. Invalid credentials return `401`; an inactive account returns `403`.

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<opaque-token>",
    "user": {
      "id": "uuid",
      "name": "Taylor Example",
      "phone": "+15551234567",
      "email": "taylor@example.com",
      "role": "CUSTOMER"
    }
  }
}
```

#### `GET /auth/me` — authenticated

Returns the current user in `data`: `id`, `name`, `email`, `phone`, `role`, `isActive`, `createdAt`, and `updatedAt`.

#### `PATCH /auth/change-password` — authenticated

Request:

```json
{ "currentPassword": "old-password", "newPassword": "new-password" }
```

Success: `200 OK`, with `{ "success": true, "message": "Password changed successfully" }`. The route currently does not apply its declared password-validation schema; enforce password length and ensure the new password differs in the frontend.

#### `POST /auth/refresh-token` — public

Request: `{ "refreshToken": "<opaque-token>" }`

Success: `200 OK`, response `data` is `{ "accessToken": "<jwt>" }`. Missing, invalid, or expired tokens return `400` or `401`; an inactive account returns `403`.

#### `POST /auth/logout` — public

Request: `{ "refreshToken": "<opaque-token>" }`

Success: `200 OK`, response message is `Logout successful`. This revokes the matching refresh token; the access token is not required.

#### `GET /auth/admin-test` — admin-only, temporary

Returns `{ "success": true, "message": "Welcome Admin" }`. This is a temporary role-check endpoint, not a product feature.

## 3. Response and error conventions

Most responses have this envelope:

```json
{ "success": true, "message": "Human-readable result", "data": {} }
```

Paginated list endpoints often put `data` and `pagination` at the top level instead. The response shape for each list is called out below. Database UUIDs are strings. Dates are ISO-8601 strings. Prisma decimal values such as `weight`, `deliveryCharge`, and payment `amount` serialize as decimal strings in JSON; clients should parse them as decimal values rather than assume a floating-point JSON number.

Common errors:

| HTTP status | Meaning |
|---|---|
| `400` | Invalid request, invalid state transition, or Zod validation error |
| `401` | Missing/invalid authentication or invalid credentials/token |
| `403` | Wrong role, inactive account, or resource ownership/assignment denied |
| `404` | Resource not found |
| `409` | Duplicate registration data |
| `500` | Unexpected server error or server configuration problem |

Application errors are returned as:

```json
{ "success": false, "message": "Error description" }
```

Zod errors use:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "code": "invalid_type", "path": ["field"], "message": "..." }
  ]
}
```

Not every route validates inputs with Zod, and framework-level errors for unknown routes may use a different shape.

## 4. Customer API

### Create a delivery

#### `POST /deliveries` — customer

Request fields:

| Field | Type | Required | Rules |
|---|---|---:|---|
| `pickupAddress` | object | Yes | `name` (min 2), `phone` (min 10), `addressLine` (min 5), `city` (min 2), `postalCode` (min 3) |
| `deliveryAddress` | object | Yes | Same fields and rules as pickup address |
| `parcelType` | string | Yes | At least 2 characters |
| `weight` | number | Yes | Positive |
| `deliveryCharge` | number | Yes | Zero or greater |
| `codAmount` | number | No | Zero or greater; defaults to `0` |
| `paymentMethod` | string | Yes | `STRIPE` or `COD` |

Example:

```json
{
  "pickupAddress": {
    "name": "Taylor Example",
    "phone": "+15551234567",
    "addressLine": "12 Main Street, Apt 4",
    "city": "Springfield",
    "postalCode": "12345"
  },
  "deliveryAddress": {
    "name": "Morgan Example",
    "phone": "+15557654321",
    "addressLine": "80 Market Road",
    "city": "Shelbyville",
    "postalCode": "54321"
  },
  "parcelType": "Documents",
  "weight": 0.75,
  "deliveryCharge": 12.5,
  "codAmount": 0,
  "paymentMethod": "STRIPE"
}
```

Success: `201 Created`; `data` contains the delivery, saved addresses, initial `PENDING` history entry, and payment record. A tracking ID is generated in the format `YD-<timestamp>-<random>`. The delivery, addresses, payment, and initial history are written in one database transaction.

The payment record amount is initialized from **`deliveryCharge`** for either payment method. `codAmount` is stored separately on the delivery; it does not set the payment record amount in the current implementation.

### List and search the customer's deliveries

#### `GET /deliveries/my-deliveries` — customer

Query parameters (all optional):

| Parameter | Type | Default / allowed values |
|---|---|---|
| `page` | integer | `1` or greater; default `1` |
| `limit` | integer | `1`–`50`; default `10` |
| `status` | string | A delivery status listed in [Enums](#8-enums) |
| `trackingId` | string | Case-insensitive partial match |
| `dateFrom` | date/time | Inclusive created-at lower bound |
| `dateTo` | date/time | Inclusive created-at upper bound |

Example: `GET /deliveries/my-deliveries?page=1&limit=10&status=IN_TRANSIT`

Success: `200 OK`:

```json
{
  "success": true,
  "message": "Deliveries retrieved successfully",
  "data": [],
  "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
}
```

Each item includes pickup and delivery addresses, payment, and delivery identifiers/status/timestamps. Results are newest first and scoped to the authenticated customer.

### Get a delivery by ID

#### `GET /deliveries/{id}` — customer

Returns the customer-owned delivery in `data`, with addresses, payment, chronological status history, and assigned agent `id`, `name`, and `phone`. A non-owned or missing delivery returns `404`.

### Track by tracking ID

#### `GET /deliveries/track/{trackingId}` — public

No login is required. Returns tracking ID, status, parcel type, weight, timestamps, pickup and delivery city/postal code, and chronological status history (`status`, `note`, `createdAt`). It does not return street address, recipient name, or phone.

### Get delivery history

#### `GET /deliveries/{id}/history` — customer

Returns `data` with `deliveryId`, `trackingId`, and chronological `history`. Each entry has `id`, `status`, `note`, `createdAt`, and the updating user's `id`, `name`, and `role`. Only the delivery's customer may access it.

### Cancel a delivery

#### `PATCH /deliveries/{id}/cancel` — customer

Request: `{ "note": "Optional reason, up to 500 characters" }`; an empty body is also accepted. Only `PENDING` and `ASSIGNED` deliveries can be cancelled by the customer. The response `data` contains the updated delivery, addresses, payment, and status history. Cancellation does not automatically update/refund the payment record in the current implementation.

## 5. Agent API

The agent router is mounted in `src/app.ts` under `/api/v1/agent`. All endpoints require a bearer access token and the `AGENT` role.

| Method and route | Access | Purpose |
|---|---|---|
| `GET /agent/me` | Agent | Agent profile |
| `GET /agent/statistics` | Agent | Counts by delivery state and success rate |
| `GET /agent/deliveries` | Agent | Paginated assigned deliveries (`page`, `limit`) |
| `PATCH /agent/deliveries/{id}/status` | Assigned agent | Advance delivery status |

The status endpoint expects `{ "status": "PICKED_UP", "note": "Optional note" }`. Allowed updates are `ASSIGNED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED` or `FAILED` from `OUT_FOR_DELIVERY`. Agent list results include customer contact details, addresses, and a payment summary.

## 6. Admin API

Every admin route requires a bearer token for an active admin role.

### Dashboard

#### `GET /admin/dashboard`

Returns `data` containing:

- `deliveries`: totals for `total`, `pending`, `assigned`, `pickedUp`, `inTransit`, `outForDelivery`, `delivered`, `cancelled`, and `failed`.
- `users`: `totalCustomers`, `totalAgents`, `activeAgents`, `inactiveAgents`.
- `payments`: `total`, `paid`, `pending`, `processing`, `failed`, `cancelled`, `refunded`, `stripe`, and `cod`.
- `revenue`: `totalPaid` and `totalPending` payment amount sums.
- `recentDeliveries`: the ten most recently created deliveries. `recentUsers`: the five most recently created users.

### Search deliveries

#### `GET /admin/deliveries`

Despite the route name, this endpoint uses a paginated search. Query parameters:

| Parameter | Type | Rules |
|---|---|---|
| `page` | integer | Default `1`, minimum `1` |
| `limit` | integer | Default `10`, range `1`–`50` |
| `status` | string | Delivery status enum |
| `trackingId` | string | Case-insensitive partial match |
| `customerId` | UUID | Exact match |
| `agentId` | UUID | Exact match |
| `dateFrom`, `dateTo` | date/time | Inclusive created-at bounds |

Success shape: `{ "success": true, "message": "...", "data": [], "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } }`. Items include addresses, payment, and customer/agent IDs, names, and phone numbers. Results are newest first.

### Delivery details and assignment

| Method and route | Request | Behavior |
|---|---|---|
| `GET /admin/deliveries/{id}` | None | Full delivery details, addresses, payment, customer/agent contact details, and status history |
| `PATCH /admin/deliveries/{id}/assign-agent` | `{ "agentId": "<agent UUID>" }` | Assign an active agent to a `PENDING` delivery and change it to `ASSIGNED` |
| `PATCH /admin/deliveries/{id}/reassign-agent` | `{ "agentId": "<agent UUID>" }` | Replace the agent on an `ASSIGNED` delivery |
| `PATCH /admin/deliveries/{id}/cancel` | `{ "note": "Optional reason" }` | Cancel any delivery except one already `DELIVERED` or `CANCELLED` |

Assignment records a status-history entry. The new agent receives a `DELIVERY_ASSIGNED` notification. Reassignment keeps the delivery status at `ASSIGNED` and records another `ASSIGNED` history entry. Admin cancellation records history but does not currently create a customer notification or change payment status.

Successful mutations return the updated delivery in `data`. Route handlers do not currently invoke all of their declared validation schemas; send a valid UUID and the documented body. In particular, do not rely on the admin cancellation note's declared 500-character limit being enforced.

### User management

#### `GET /admin/users`

Query parameters: `page` (default `1`), `limit` (default `10`, max `50`), optional `role` (`CUSTOMER`, `AGENT`, `ADMIN`), and optional `isActive` (`true` or `false`). **Known behavior:** `isActive` is parsed with boolean coercion, so the query string `isActive=false` currently evaluates as true; filtering for inactive users is unreliable until the backend parser is corrected.

Response: `data` is an object with `users` and `pagination`:

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [],
    "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
  }
}
```

Each user has `id`, `name`, `email`, `phone`, `role`, `isActive`, `createdAt`, and `updatedAt`.

| Method and route | Request | Behavior |
|---|---|---|
| `GET /admin/users/{id}` | None | Get a user's public profile fields |
| `PATCH /admin/users/{id}/status` | `{ "isActive": false }` | Activate/deactivate a user; an admin cannot change their own active status |
| `PATCH /admin/users/{id}/role` | `{ "role": "AGENT" }` | Change role; an admin cannot change their own role |

The role update endpoint permits `CUSTOMER`, `AGENT`, and `ADMIN`. The frontend should treat these as privileged actions and confirm before submitting.

### Agent profile and statistics (admin view)

| Method and route | Response |
|---|---|
| `GET /admin/agents/{id}` | User profile fields; the implementation currently does not check that the user is actually an agent |
| `GET /admin/agents/{id}/statistics` | Agent profile and statistics |

Statistics include `totalAssigned`, `activeDeliveries`, `completedDeliveries`, `delivered`, `failed`, `cancelled`, `statusBreakdown` (`assigned`, `pickedUp`, `inTransit`, `outForDelivery`), and `successRate` as a percentage from `0` to `100`. `completedDeliveries` includes both delivered and failed deliveries; the rate is delivered divided by those completed deliveries. With no completed deliveries, the rate is `0`.

## 7. Payments and notifications

### Stripe payment

1. Create a delivery with `paymentMethod: "STRIPE"`.
2. Call `POST /payments/create-intent` with its delivery ID.
3. Use the returned `clientSecret` with Stripe.js/Payment Element. Never expose `STRIPE_SECRET_KEY` or call Stripe's secret-key APIs from the frontend.
4. Treat the webhook-updated payment status as authoritative. Poll `GET /payments/{deliveryId}` or refresh the delivery/payment view after the Stripe UI reports completion.

#### `POST /payments/create-intent` — customer

Request: `{ "deliveryId": "<delivery UUID>" }`

Success response `data`: `{ "clientSecret": "...", "paymentIntentId": "pi_..." }`. This only works for a delivery owned by the caller that uses Stripe and is not already paid. Currency is set by `STRIPE_CURRENCY` (default `usd`); the amount is the delivery charge converted to minor units.

#### `GET /payments/{deliveryId}` — customer

Returns a payment belonging to the caller's delivery in `data`: `id`, `deliveryId`, `method`, `status`, `amount`, `stripePaymentId`, `paidAt`, `createdAt`, `updatedAt`. It does not return the client secret.

#### Stripe webhook — server-to-server

`POST /payments/webhook` is handled at `/api/v1/payments/webhook`. Stripe sends the raw request body and `Stripe-Signature`; this endpoint is not for browser/client use. Configure the Stripe webhook secret and listen for `payment_intent.succeeded`, `payment_intent.payment_failed`, and `payment_intent.processing`. Other event types are acknowledged and ignored. A valid event returns `200`.

### Cash on Delivery

Create the delivery with `paymentMethod: "COD"`. Once the delivery is `DELIVERED`, its assigned agent marks the payment paid:

#### `PATCH /payments/{deliveryId}/cod-paid` — assigned agent

Request body: none required. The authenticated agent must be assigned to the delivery; it must be delivered and have a COD payment that is not already paid, cancelled, or refunded. Success response `data` contains payment `id`, `deliveryId`, `method`, `status`, `amount`, `paidAt`, `createdAt`, and `updatedAt`.

This route is registered under the payments API and requires an authenticated agent assigned to the delivered COD parcel.

### Notifications

All notification endpoints require authentication. Notifications are scoped to the current user.

| Method and route | Query/body | Result |
|---|---|---|
| `GET /notifications` | `page` default `1`; `limit` default `10`, max `50` | Top-level `data` array and `pagination`; newest first |
| `GET /notifications/unread-count` | None | `data: { "unreadCount": 0 }` |
| `PATCH /notifications/{id}/read` | None | Marks one owned notification read; returns it in `data` |
| `PATCH /notifications/read-all` | None | `data: { "updatedCount": 0 }` |

Notification values for `type` include `DELIVERY_ASSIGNED`, `DELIVERY_STATUS_UPDATED`, `DELIVERY_DELIVERED`, `DELIVERY_CANCELLED`, `PAYMENT_PAID`, `PAYMENT_FAILED`, and `COD_PAYMENT_RECEIVED`. The currently implemented producers create agent assignment and customer delivery-status notifications. A notification is not pushed over WebSocket/SSE; the frontend must poll or refresh.

## 8. Enums

### Delivery status

`PENDING`, `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `FAILED`

Normal agent progression:

```text
PENDING --admin assigns--> ASSIGNED
  -> PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED
                                                   -> FAILED
```

Customer cancellation is allowed from `PENDING` or `ASSIGNED`. Admin cancellation is allowed in every state except `DELIVERED` and `CANCELLED`. `CANCELLED` and `FAILED` do not have a further transition in the agent workflow.

### Payment method and status

- Method: `STRIPE`, `COD`
- Status: `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `CANCELLED`, `REFUNDED`

Stripe webhook events update payment status to `PROCESSING`, `PAID`, or `FAILED`. The COD flow updates status to `PAID`.

## 9. User/profile endpoints

| Method and route | Access | Behavior |
|---|---|---|
| `GET /users` | **Public in current implementation** | Lists all users' non-password profile fields; no pagination |
| `GET /users/me` | Authenticated | Returns current user profile in `data` |
| `PATCH /users/me` | Authenticated | Updates `name` and/or `phone`; returns updated profile in `data` |

The profile update schema declares `name` length 2–100 and `phone` length 10–15, but the route currently does not call that schema. Duplicate phone numbers return `409`. Avoid using the public `GET /users` endpoint as a frontend directory; it exposes personal contact details and is not paginated.

## 10. Root and health checks

| Method and route | Access | Success |
|---|---|---|
| `GET /` | Public | `{ "success": true, "message": "Welcome to Your Delivery API" }` |
| `GET /api/health` | Public | `200` with `{ "success": true, "message": "Your Delivery API is running", "database": "connected" }`; `500` if database check fails |

## 11. Configuration and integration checklist

Backend deployment requires the following environment variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Signs and verifies access tokens |
| `JWT_REFRESH_SECRET` | Present in the environment template; refresh tokens are currently opaque random values, so this secret is not used by the implementation |
| `JWT_ACCESS_EXPIRES_IN` | Optional access JWT duration; not listed in `.env.example` |
| `STRIPE_SECRET_KEY` | Server-side Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures |
| `STRIPE_CURRENCY` | Stripe currency code; defaults to `usd` |
| `PORT` | HTTP server port; defaults to `5000` |
| `NODE_ENV` | Runtime environment |
| `CORS_ORIGINS` | Comma-separated exact browser origins, e.g. `http://localhost:5173,https://app.example.com`; origins must not include a path |

Before release, confirm with the backend owner:

- The deployed backend includes the agent router at `/api/v1/agent`.
- `CORS_ORIGINS` includes the exact deployed frontend origin and the local development origin as needed. An origin includes scheme, hostname, and port, but no URL path or trailing slash.
- The production base URL and token expiry are current.
- Stripe webhook delivery is configured and tested.
- Delivery charges, `codAmount`, and the amount charged/collected are consistent with the intended product rules.
- The frontend knows that registration does not return tokens and will follow it with login.

## 12. Endpoint index

`{id}` denotes a UUID unless it is explicitly named `trackingId`.

| Method | Path | Access |
|---|---|---|
| `GET` | `/` | Public |
| `GET` | `/api/health` | Public |
| `POST` | `/auth/register` | Public |
| `POST` | `/auth/login` | Public |
| `GET` | `/auth/me` | Authenticated |
| `PATCH` | `/auth/change-password` | Authenticated |
| `POST` | `/auth/refresh-token` | Public |
| `POST` | `/auth/logout` | Public |
| `GET` | `/auth/admin-test` | Admin; temporary |
| `GET` | `/users` | Public |
| `GET` | `/users/me` | Authenticated |
| `PATCH` | `/users/me` | Authenticated |
| `POST` | `/deliveries` | Customer |
| `GET` | `/deliveries/my-deliveries` | Customer |
| `GET` | `/deliveries/{id}` | Customer |
| `GET` | `/deliveries/track/{trackingId}` | Public |
| `GET` | `/deliveries/{id}/history` | Customer |
| `PATCH` | `/deliveries/{id}/cancel` | Customer |
| `GET` | `/agent/me` | Agent |
| `GET` | `/agent/statistics` | Agent |
| `GET` | `/agent/deliveries` | Agent |
| `PATCH` | `/agent/deliveries/{id}/status` | Assigned agent |
| `GET` | `/admin/dashboard` | Admin |
| `GET` | `/admin/deliveries` | Admin |
| `GET` | `/admin/deliveries/{id}` | Admin |
| `PATCH` | `/admin/deliveries/{id}/assign-agent` | Admin |
| `PATCH` | `/admin/deliveries/{id}/reassign-agent` | Admin |
| `PATCH` | `/admin/deliveries/{id}/cancel` | Admin |
| `GET` | `/admin/users` | Admin |
| `GET` | `/admin/users/{id}` | Admin |
| `PATCH` | `/admin/users/{id}/status` | Admin |
| `PATCH` | `/admin/users/{id}/role` | Admin |
| `GET` | `/admin/agents/{id}` | Admin |
| `GET` | `/admin/agents/{id}/statistics` | Admin |
| `POST` | `/payments/create-intent` | Customer |
| `GET` | `/payments/{deliveryId}` | Customer |
| `POST` | `/payments/webhook` | Stripe server-to-server |
| `PATCH` | `/payments/{deliveryId}/cod-paid` | Assigned agent |
| `GET` | `/notifications` | Authenticated |
| `GET` | `/notifications/unread-count` | Authenticated |
| `PATCH` | `/notifications/{id}/read` | Authenticated |
| `PATCH` | `/notifications/read-all` | Authenticated |
