import { Queue } from "bullmq";
import IORedis from "ioredis";

// Reuse the connection to avoid too many open connections
const connection = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    family: 0, // resolve IPv4 and IPv6 (Railway private network is IPv6)
    maxRetriesPerRequest: null,
});

export const alertQueue = new Queue("alert-queue", { connection });
