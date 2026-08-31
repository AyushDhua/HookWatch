# HookWatch

HookWatch is a lightweight webhook inspection and debugging tool for developers. Create a unique public webhook URL, send requests to it from any service or tool, and inspect every captured request — headers, query parameters, body, method, and source IP — in a clean web dashboard.

---

## Features

- Register / log in with JWT-based authentication
- Create webhook endpoints with unique public URLs
- Receive and capture incoming webhook requests (any HTTP method)
- Browse request history per endpoint
- Inspect full request details — method, headers, query params, body, source IP, timestamp
- Search and filter requests by keyword, HTTP method, and status
- Delete endpoints

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Query |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT, bcryptjs |
| Validation | Zod |

---

## Architecture

```
React
 ↓
Express REST API
 ↓
Prisma
 ↓
PostgreSQL
```

**Webhook capture flow:**

```
External Service / cURL / Postman
 ↓
Express  ANY /h/:token
 ↓
Identify & validate endpoint
 ↓
Store WebhookEvent in PostgreSQL
 ↓
React Dashboard displays the event
```

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- PostgreSQL (local instance or Docker)

### 1. Clone the repository

```bash
git clone https://github.com/AyushDhua/HookWatch.git
cd hookwatch
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
# Edit .env and set DATABASE_URL and JWT_SECRET
```

### 3. Install dependencies

```bash
# From project root
npm run dev:client   # starts Vite on port 5173
npm run dev:server   # starts Express on port 5000
```

Or individually:

```bash
cd client && npm install && npm run dev
cd server && npm install && npm run dev
```

### 4. Run Prisma migrations

```bash
cd server
npx prisma migrate dev --name init
```

---

## Environment Variables

See [`server/.env.example`](server/.env.example) for the full list.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `PORT` | Server port (default: `5000`) |

**Never commit `.env` or any real secrets.**

---

## API Overview

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Log in, receive JWT |
| GET | `/api/auth/me` | ✓ | Current user info |
| POST | `/api/endpoints` | ✓ | Create webhook endpoint |
| GET | `/api/endpoints` | ✓ | List user's endpoints |
| GET | `/api/endpoints/:id` | ✓ | Get single endpoint |
| DELETE | `/api/endpoints/:id` | ✓ | Delete endpoint |
| GET | `/api/endpoints/:id/events` | ✓ | List events for endpoint |
| GET | `/api/events/:id` | ✓ | Get single event details |
| ANY | `/h/:token` | — | Webhook receiver |

---

## Testing

```bash
cd server
npm test
```

---

## Webhook Example

```bash
curl -X POST http://localhost:5000/h/YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"event":"test","message":"Hello HookWatch"}'
```

---

## Live Demo

[🌐 ⁠Try HookWatch Live](https://hookwatch.onrender.com)

### Demo Credentials
Use these credentials to log in and inspect the dashboard immediately without registering a new account:
* **Email**: `demo@hookwatch.dev`
* **Password**: `password123`

## Production Testing

You can test the deployed webhook receiver directly from your terminal using the following copy-pasteable `curl` commands.

> [!IMPORTANT]
> First define the `WEBHOOK_URL` variable in your terminal, replacing `YOUR_PUBLIC_TOKEN` with a webhook token generated from your HookWatch dashboard:
> ```bash
> WEBHOOK_URL="https://hookwatch-api.onrender.com/h/YOUR_PUBLIC_TOKEN"
> ```

---

### Test 1 — GET + Query Parameters
**Purpose**: Verify that HookWatch accepts GET requests and correctly captures URL query parameters.

**Command**:
```bash
curl -i -G "$WEBHOOK_URL" \
  --data-urlencode "source=terminal" \
  --data-urlencode "test=123" \
  --data-urlencode "environment=production"
```

**Expected Response**:
`HTTP/1.1 200 OK`
```json
{"received":true}
```

**Verification inside Event History**:
* **Method**: `GET`
* **Status**: `200`
* **Query Parameters**:
  * `source`: `terminal`
  * `test`: `123`
  * `environment`: `production`

---

### Test 2 — POST + JSON Body
**Purpose**: Verify JSON payload capture, content-type headers, and custom headers.

**Command**:
```bash
curl -i -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Test-Source: terminal" \
  -d '{
    "event": "production-test",
    "message": "Hello HookWatch",
    "value": 123,
    "source": "curl"
  }'
```

**Expected Response**:
`HTTP/1.1 200 OK`
```json
{"received":true}
```

**Verification inside Event History**:
* **Method**: `POST`
* **Status**: `200`
* **Headers**: `Content-Type: application/json`, `X-Test-Source: terminal`
* **Body**: JSON object matching the input payload

---

### Test 3 — PUT + Custom Headers + JSON
**Purpose**: Verify that the public receiver supports HTTP methods other than POST and captures custom headers.

**Command**:
```bash
curl -i -X PUT "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Test-Method: PUT" \
  -H "X-Client: HookWatch-Terminal" \
  -d '{
    "event": "put-test",
    "operation": "update",
    "value": 456
  }'
```

**Expected Response**:
`HTTP/1.1 200 OK`
```json
{"received":true}
```

**Verification inside Event History**:
* **Method**: `PUT`
* **Status**: `200`
* **Headers**: `X-Test-Method: PUT`, `X-Client: HookWatch-Terminal`
* **Body**: JSON object matching the input payload

---

### Test 4 — PATCH + Plain Text Body
**Purpose**: Verify support for non-JSON/text payloads.

**Command**:
```bash
curl -i -X PATCH "$WEBHOOK_URL" \
  -H "Content-Type: text/plain" \
  -H "X-Test-Type: plain-text" \
  --data 'Hello from HookWatch production testing'
```

**Expected Response**:
`HTTP/1.1 200 OK`
```json
{"received":true}
```

**Verification inside Event History**:
* **Method**: `PATCH`
* **Status**: `200`
* **Headers**: `Content-Type: text/plain`, `X-Test-Type: plain-text`
* **Body**: `Hello from HookWatch production testing`

---

### Test 5 — Invalid Webhook Token (Security Test)
**Purpose**: Verify that nonexistent public webhook tokens are rejected.

**Command**:
```bash
curl -i "https://hookwatch-api.onrender.com/h/THIS_TOKEN_DOES_NOT_EXIST"
```

**Expected Response**:
`HTTP/1.1 404 Not Found`
```json
{"error":"Webhook endpoint not found"}
```
*(This confirms HookWatch rejects arbitrary or unauthorized webhook tokens).*

---

## Why These Choices?

| Decision | Reason |
|---|---|
| PostgreSQL | Users, endpoints, and events have clear relational structure |
| Prisma | Typed database access + built-in migration workflow |
| JWT | Simple, stateless auth suited to a REST API |
| JSONB (headers/body) | Webhook payloads have varying structure |
| REST | The operations are straightforward CRUD and retrieval |
| Routes → Controllers → Services | Keeps HTTP handling, business logic, and DB access clearly separated |
