import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    maxRetriesPerRequest: null,
});

console.log("🚀 Alert Worker Started");

const worker = new Worker("alert-queue", async (job) => {
    console.log(`[Job ${job.id}] Processing Alert:`, job.data);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Here involves logic to send email/SMS
    console.log(`[Job ${job.id}] Alert Sent: ${job.data.title}`);
}, { connection });

worker.on("completed", (job) => {
    console.log(`[Job ${job.id}] Completed`);
});

worker.on("failed", (job, err) => {
    console.log(`[Job ${job?.id}] Failed: ${err.message}`);
});
