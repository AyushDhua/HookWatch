import { PrismaClient } from '@prisma/client';

// A single shared PrismaClient instance for the whole application.
// Creating one instance per request would exhaust the connection pool.
const prisma = new PrismaClient();

export default prisma;
