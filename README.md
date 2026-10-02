# Your Delivery — Backend

A full-stack courier and parcel delivery backend built with **Node.js, Express.js, TypeScript, Prisma, and PostgreSQL**.

The project provides role-based delivery management for **Customers, Agents, and Admins**, including authentication, delivery workflows, payment processing, delivery tracking, and administrative operations.

## 🚀 Live API

**Production API:** `https://your-delivery.onrender.com/`

**Health Check:** `https://your-delivery.onrender.com/api/health`

> Frontend integration: see the [complete frontend API guide](./docs/FRONTEND_API_GUIDE.md) for endpoint contracts, authentication, request/response examples, workflows, and known routing/integration limitations.


---

## 📌 Project Overview

Your Delivery is designed as a courier management platform where:

- Customers can create and track deliveries.
- Admins can manage users, assign/reassign agents, and manage deliveries.
- Agents can view assigned deliveries and update delivery statuses.
- Customers can pay using Stripe or choose Cash on Delivery (COD).
- Delivery status changes are stored as a history for tracking and auditing.

The backend follows a modular REST API architecture with Prisma ORM and PostgreSQL.

---

## ✨ Features

### 🔐 Authentication & Authorization

- Customer registration and login
- Email/password authentication
- JWT access tokens
- Refresh token system
- Logout
- Change password
- Authenticated user profile
- Role-based authorization
- Three user roles:
  - `CUSTOMER`
  - `AGENT`
  - `ADMIN`
- Protected routes
- Active/inactive user control

### 📦 Delivery Management

- Create delivery
- Customer delivery history
- Delivery tracking by tracking ID
- Delivery details
- Delivery status history
- Customer cancellation
- Admin cancellation
- Agent assignment
- Agent reassignment
- Agent delivery status updates

### 🚚 Delivery Workflow

```text
PENDING
   ↓
ASSIGNED
   ↓
PICKED_UP
   ↓
IN_TRANSIT
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED
```

Additional states:

```text
CANCELLED
FAILED
```

Status transitions are controlled according to the user's role and the current delivery state.

### 💳 Payment

#### Stripe

- Stripe PaymentIntent creation
- Payment status tracking
- Stripe webhook handling
- Successful payment tracking
- Failed payment tracking
- Processing payment tracking

#### Cash on Delivery

- COD payment support
- Agent can mark COD payment as paid after delivery
- Payment status and `paidAt` tracking

### 👨‍💼 Admin Management

Admins can:

- View all deliveries
- View delivery details
- Assign agents
- Reassign agents
- Cancel deliveries
- View users
- View individual users
- Activate/deactivate users
- Change user roles

### 🧑‍💼 Agent Management

Agents can:

- View assigned deliveries
- Update delivery status
- Mark eligible COD payments as paid

### 🛡️ Validation & Error Handling

- Zod request validation
- Centralized application errors
- Async error handling
- HTTP status codes
- Authentication/authorization errors
- Ownership checks
- Delivery state validation
- Payment state validation
- Invalid resource handling

---

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | REST API framework |
| TypeScript | Type-safe development |
| Prisma | ORM |
| PostgreSQL | Relational database |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Zod | Request validation |
| Stripe | Online payment |
| Render | Backend deployment |
| Neon | PostgreSQL hosting |
| Postman | API testing/documentation |

---

## 📂 Project Structure

```text
your-delivery-backend/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   │
│   ├── config/
│   │   └── stripe.ts
│   │
│   ├── generated/
│   │   └── prisma/
│   │
│   ├── lib/
│   │   └── prisma.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── role.middleware.ts
│   │
│   ├── modules/
│   │   ├── admin/
│   │   ├── agent/
│   │   ├── auth/
│   │   ├── delivery/
│   │   ├── payment/
│   │   └── user/
│   │
│   ├── utils/
│   │   ├── AppError.ts
│   │   ├── asyncHandler.ts
│   │   └── jwt.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

## 🗄️ Database Design

The application uses PostgreSQL with Prisma ORM.

### Main Models

```text
User
 │
 ├── RefreshToken
 │
 ├── Delivery (as Customer)
 │
 ├── Delivery (as Agent)
 │
 └── DeliveryStatusHistory

Delivery
 │
 ├── Pickup Address
 ├── Delivery Address
 ├── Payment
 └── Status History
```

### Main Database Entities

- `User`
- `RefreshToken`
- `Address`
- `Delivery`
- `DeliveryStatusHistory`
- `Payment`

### User Roles

```text
CUSTOMER
AGENT
ADMIN
```

### Payment Methods

```text
STRIPE
COD
```

### Payment Statuses

```text
PENDING
PROCESSING
PAID
FAILED
CANCELLED
REFUNDED
```

The database also uses:

- Foreign-key relationships
- Unique constraints
- UUID primary keys
- Cascade deletion where appropriate
- Database indexes
- Prisma migrations

---

## 🔑 API Endpoints

Base URL:

```text
/api/v1
```

The complete frontend contract—including authentication, all currently mounted endpoints, request/response examples, workflows, and known limitations—is documented in the [Frontend API Guide](./docs/FRONTEND_API_GUIDE.md).

The database health check is `GET /api/health` (outside the `/api/v1` prefix).

---

## 🔒 Authorization

Protected endpoints use a JWT access token:

```http
Authorization: Bearer <access_token>
```

Role-based middleware restricts access to protected resources.

Example:

```text
Customer
   └── Customer delivery operations

Agent
   └── Assigned delivery operations

Admin
   └── User + delivery management
```

---

## 💰 Payment Flow

### Stripe

```text
Customer
   ↓
Create Delivery
   ↓
Create PaymentIntent
   ↓
Customer completes payment
   ↓
Stripe
   ↓
Webhook
   ↓
Payment status updated
```

### COD

```text
Customer
   ↓
Create COD Delivery
   ↓
Admin assigns Agent
   ↓
Agent delivers parcel
   ↓
Delivery = DELIVERED
   ↓
Agent marks COD as PAID
```

---

## ⚙️ Environment Variables

Create a `.env` file locally:

```env
DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CURRENCY=usd

PORT=5000
NODE_ENV=development
```

Never commit the real `.env` file to GitHub.

A safe `.env.example` should contain variable names only.

---

## 🛠️ Local Development

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/your-delivery-backend.git
cd your-delivery-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create:

```text
.env
```

and add the required values.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Apply migrations

For an existing development database:

```bash
npx prisma migrate dev
```

### 6. Start development server

```bash
npm run dev
```

The API will run on:

```text
http://localhost:5000
```

---

## 🏭 Production

Build the project:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

Production migration command:

```bash
npx prisma migrate deploy
```

---

## 📮 Postman API Collection

The project includes a Postman collection for testing the API.

The collection covers:

- Authentication
- User APIs
- Customer delivery APIs
- Admin APIs
- Agent APIs
- Payment APIs

Import the collection into Postman and configure the production API base URL.

Example:

```text
https://YOUR-RENDER-DOMAIN/api/v1
```

---

## 🧪 API Testing

The deployed API can be tested through:

- Postman
- Browser for public endpoints
- Stripe webhook testing tools/CLI for Stripe events

Health check:

```http
GET https://YOUR-RENDER-DOMAIN/api/health
```

---

## ☁️ Deployment

### Backend

The Express backend is deployed on:

**Render**

### Database

The PostgreSQL database is hosted on:

**Neon**

Deployment architecture:

```text
                ┌──────────────────┐
                │   Client / App   │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │  Render Backend  │
                │ Express + TS     │
                └────────┬─────────┘
                         │
                    Prisma ORM
                         │
                         ▼
                ┌──────────────────┐
                │ Neon PostgreSQL  │
                └──────────────────┘
```

---

## 📈 Current Project Scope

The current version focuses on the core backend/MVP functionality:

- Authentication
- Role-based authorization
- Customer delivery management
- Admin delivery management
- Agent delivery workflow
- Delivery tracking
- Delivery history
- Stripe payments
- COD payments
- PostgreSQL database
- Production deployment

### Planned Improvements

Future development can include:

- Mounting the agent router and enabling/configuring frontend CORS
- Security hardening and automated tests
- Swagger/OpenAPI documentation and integration testing
- Additional production optimizations

---

## 🎯 Learning & Development Goals

This project was built to practice real-world backend development concepts including:

- REST API design
- TypeScript
- Express.js architecture
- Prisma ORM
- PostgreSQL relational database design
- JWT authentication
- Role-based authorization
- Transaction handling
- Input validation
- Error handling
- Payment integration
- Webhook handling
- Production deployment

---

## 👨‍💻 Author

**Abdullah Muhammad Siam**

Full Stack Developer — MERN / Next.js

GitHub: `https://github.com/abdullahMsiam`

---

## 📄 License

This project is created for educational, portfolio, and development purposes.
