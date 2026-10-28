import { Queue } from "bullmq";
import IORedis from "ioredis";

// Set DISABLE_QUEUE=true to run without Redis (e.g. on Vercel); alerts are saved but not emailed
const queueDisabled = process.env.DISABLE_QUEUE === "true";

// Reuse the connection to avoid too many open connections
const connection = queueDisabled
    ? null
    : new IORedis({
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379"),
          password: process.env.REDIS_PASSWORD,
          family: 0, // resolve IPv4 and IPv6 (Railway private network is IPv6)
          maxRetriesPerRequest: null,
      });

export const alertQueue = connection
    ? new Queue("alert-queue", { connection })
    : null;
