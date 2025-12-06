import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client-business";

const connectionString = `${process.env.DATABASE_URL_BUSINESS}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prismaBusiness: PrismaClient };

export const prismaBusiness =
  globalForPrisma.prismaBusiness ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaBusiness = prismaBusiness;
