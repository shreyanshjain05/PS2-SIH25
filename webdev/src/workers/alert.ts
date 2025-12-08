import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prismaGov } from "@/lib/db/gov";
import { sendEmail } from "@/lib/email";
import { getSuggestions } from "@/lib/suggestions";
import { getDepartmentEmail } from "@/lib/departments";
import { generateEmailHtml } from "@/lib/email-templates";

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
    const {
      alertId,
      recipients,
      category,
      pollutant,
      riskFactors,
      forecast,
      regionName,
      title,
    } = job.data;

    if (!alertId) {
      throw new Error("Alert ID missing in job data");
    }

    try {
      // Iterate over recipients and send individual emails
      const recipientList = Array.isArray(recipients)
        ? recipients
        : [recipients];

      for (const dept of recipientList) {
        if (!dept) continue;

        const suggestions = getSuggestions(dept, category);

        const emailContent = generateEmailHtml({
          department: dept,
          title,
          regionName,
          category,
          pollutant,
          forecast,
          riskFactors: Array.isArray(riskFactors) ? riskFactors : [riskFactors],
          suggestions,
        });

        // Get configured email for department
        const deptEmail = getDepartmentEmail(dept);

        await sendEmail(deptEmail, `ACTION REQUIRED: ${title}`, emailContent);
      }

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
