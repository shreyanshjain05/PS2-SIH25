import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL_AUTH}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prismaAuth: PrismaClient };

export const prismaAuth =
  globalForPrisma.prismaAuth ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaAuth = prismaAuth;
