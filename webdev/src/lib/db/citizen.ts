import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client-citizen";

const connectionString = `${process.env.DATABASE_URL_CITIZEN}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prismaCitizen: PrismaClient };

export const prismaCitizen =
  globalForPrisma.prismaCitizen ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaCitizen = prismaCitizen;
