import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prismaGov } from "../lib/db/gov";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
});

console.log("Alert Worker Started");

const worker = new Worker(
  "alert-queue",
  async (job) => {
    console.log(`[Job ${job.id}] Processing Alert:`, job.data);
    const { alertId } = job.data;

    if (!alertId) {
      throw new Error("Alert ID missing in job data");
    }

    // Simulate processing time (e.g. sending SMS/Email)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await prismaGov.alert.update({
        where: { id: alertId },
        data: { status: "SENT" },
      });
      console.log(`[Job ${job.id}] Alert ${alertId} marked as SENT`);
    } catch (error) {
      console.error(`[Job ${job.id}] Failed to update alert status:`, error);
      await prismaGov.alert.update({
        where: { id: alertId },
        data: { status: "FAILED" },
      });
      throw error;
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`[Job ${job.id}] Completed`);
});

worker.on("failed", (job, err) => {
  console.log(`[Job ${job?.id}] Failed: ${err.message}`);
});
