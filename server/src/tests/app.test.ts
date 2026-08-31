import 'dotenv/config';
import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';

describe('HookWatch E2E Test Suite', () => {
  // Store dynamic IDs and tokens for verification
  let tokenA: string;
  let tokenB: string;
  let userIdA: string;
  let userIdB: string;
  let endpointAId: string;
  let endpointBId: string;
  let publicTokenA: string;
  let eventAId: string;

  beforeAll(async () => {
    // Clear database to prevent pollution and collision
    await prisma.webhookEvent.deleteMany({});
    await prisma.endpoint.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Disconnect prisma connection pool
    await prisma.webhookEvent.deleteMany({});
    await prisma.endpoint.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  // ─── 1. Authentication Tests ───────────────────────────────────────────────
  describe('Authentication API', () => {
    it('should successfully register User A', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User A',
          email: 'usera_test@hookwatch.dev',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('usera_test@hookwatch.dev');
      expect(res.body.user.passwordHash).toBeUndefined(); // Verify hash is NOT returned
      userIdA = res.body.user.id;
    });

    it('should reject duplicate registration of same email address', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User A Duplicate',
          email: 'usera_test@hookwatch.dev',
          password: 'password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('email already exists');
    });

    it('should successfully login User A and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'usera_test@hookwatch.dev',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      tokenA = res.body.token;
    });

    it('should reject login with invalid credentials (password wrong)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'usera_test@hookwatch.dev',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should successfully register and login User B', async () => {
      // Register
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User B',
          email: 'userb_test@hookwatch.dev',
          password: 'password123',
        });
      expect(regRes.status).toBe(201);
      userIdB = regRes.body.user.id;

      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'userb_test@hookwatch.dev',
          password: 'password123',
        });
      expect(loginRes.status).toBe(200);
      tokenB = loginRes.body.token;
    });
  });

  // ─── 2. Authorization Guards ───────────────────────────────────────────────
  describe('Authorization Guards', () => {
    it('should reject access with missing JWT on protected routes', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should reject access with invalid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });
  });

  // ─── 3. Endpoint Management Tests ──────────────────────────────────────────
  describe('Endpoints API', () => {
    it('should allow User A to create a new webhook endpoint', async () => {
      const res = await request(app)
        .post('/api/endpoints')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Endpoint A' });

      expect(res.status).toBe(201);
      expect(res.body.endpoint).toBeDefined();
      expect(res.body.endpoint.name).toBe('Endpoint A');
      expect(res.body.endpoint.publicToken).toBeDefined();
      expect(res.body.endpoint.userId).toBe(userIdA);

      endpointAId = res.body.endpoint.id;
      publicTokenA = res.body.endpoint.publicToken;
    });

    it('should allow User B to create a new webhook endpoint', async () => {
      const res = await request(app)
        .post('/api/endpoints')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Endpoint B' });

      expect(res.status).toBe(201);
      endpointBId = res.body.endpoint.id;
    });

    it("should allow User A to list User A's endpoints", async () => {
      const res = await request(app)
        .get('/api/endpoints')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.endpoints)).toBe(true);
      expect(res.body.endpoints.length).toBe(1);
      expect(res.body.endpoints[0].id).toBe(endpointAId);
    });

    it("should prevent User A from retrieving User B's endpoint directly (ownership check, returns 404)", async () => {
      const res = await request(app)
        .get(`/api/endpoints/${endpointBId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Endpoint not found');
    });

    it("should prevent User A from deleting User B's endpoint (ownership check, returns 404)", async () => {
      const res = await request(app)
        .delete(`/api/endpoints/${endpointBId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Endpoint not found');
    });
  });

  // ─── 4. Public Webhook Receiver Tests ──────────────────────────────────────
  describe('Webhook Receiver API', () => {
    it('should accept valid webhook requests without JWT and capture properties', async () => {
      const res = await request(app)
        .post(`/h/${publicTokenA}`)
        .query({ secret: 'yes' })
        .set('X-Test-Header', 'custom-header-value')
        .send({ event: 'ping', data: 'hello' });

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      // Verify request is stored correctly in PostgreSQL database
      const event = await prisma.webhookEvent.findFirst({
        where: { endpointId: endpointAId },
      });

      expect(event).toBeDefined();
      expect(event!.method).toBe('POST');
      expect(event!.statusCode).toBe(200);

      // Verify custom query params, headers, and body JSON
      const query = event!.queryParams as any;
      const headers = event!.headers as any;
      const body = event!.body as any;

      expect(query.secret).toBe('yes');
      expect(headers['x-test-header']).toBe('custom-header-value');
      expect(body.event).toBe('ping');

      eventAId = event!.id;
    });

    it('should reject webhook requests sent with an invalid token', async () => {
      const res = await request(app)
        .post('/h/nonexistentpublictokenvalue')
        .send({ test: true });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Webhook endpoint not found');
    });

    it('should reject webhook requests sent to an inactive endpoint (returns 403)', async () => {
      // Deactivate endpoint A
      await prisma.endpoint.update({
        where: { id: endpointAId },
        data: { isActive: false },
      });

      const res = await request(app)
        .post(`/h/${publicTokenA}`)
        .send({ test: true });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Webhook endpoint is inactive');

      // Re-activate endpoint A for subsequent tests
      await prisma.endpoint.update({
        where: { id: endpointAId },
        data: { isActive: true },
      });
    });
  });

  // ─── 5. Event History API Tests ────────────────────────────────────────────
  describe('Webhook Events API', () => {
    it("should allow User A to query Endpoint A's request logs", async () => {
      const res = await request(app)
        .get(`/api/endpoints/${endpointAId}/events`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toBeDefined();
      expect(res.body.events.length).toBe(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(1);
    });

    it("should prevent User A from accessing User B's endpoint event list (returns 404)", async () => {
      const res = await request(app)
        .get(`/api/endpoints/${endpointBId}/events`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Endpoint not found');
    });

    it('should allow User A to retrieve their own event details by ID', async () => {
      const res = await request(app)
        .get(`/api/events/${eventAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.event).toBeDefined();
      expect(res.body.event.id).toBe(eventAId);
    });

    it("should prevent User A from accessing User B's event details by guessing event ID (returns 404)", async () => {
      // We will create a webhook event on Endpoint B
      const eventB = await prisma.webhookEvent.create({
        data: {
          endpointId: endpointBId,
          method: 'GET',
          headers: {},
          queryParams: {},
          sourceIp: '127.0.0.1',
          statusCode: 200,
        },
      });

      const res = await request(app)
        .get(`/api/events/${eventB.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Event not found');
    });
  });

  // ─── 6. Endpoint Deletion & Cascade Cleanups ──────────────────────────────
  describe('Endpoints Deletion and Cascading Cleanup', () => {
    it("should allow User A to delete User A's owned endpoint", async () => {
      const res = await request(app)
        .delete(`/api/endpoints/${endpointAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(204);
    });

    it('should verify the endpoint and all its associated events were deleted via cascade', async () => {
      // Check endpoint is gone
      const endpoint = await prisma.endpoint.findUnique({
        where: { id: endpointAId },
      });
      expect(endpoint).toBeNull();

      // Check events associated are gone
      const eventCount = await prisma.webhookEvent.count({
        where: { endpointId: endpointAId },
      });
      expect(eventCount).toBe(0);
    });
  });
});
