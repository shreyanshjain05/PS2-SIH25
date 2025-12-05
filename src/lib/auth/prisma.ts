import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

const _global = globalThis as unknown as { __prismaClient?: PrismaClient };

export const prisma = (_global.__prismaClient ??= new PrismaClient({
  adapter,
}));

export default prisma;
