"use server";

import { prismaGov } from "@/lib/db/gov";
import { alertQueue } from "@/lib/queue";
import { revalidatePath } from "next/cache";

export async function sendAlert(formData: FormData) {
  const title = formData.get("title") as string;
  const message = formData.get("message") as string;
  const severity = formData.get("severity") as string;

  // Handle multiple recipients
  const recipients = formData.getAll("recipient");
  const recipient = recipients.length > 0 ? recipients.join(", ") : "";

  const region = formData.get("region") as string;

  if (!title || !message || !severity || !recipient) {
    throw new Error("Missing required fields");
  }

  const alert = await prismaGov.alert.create({
    data: {
      title,
      message,
      severity,
      recipient,
      region,
      status: "PENDING",
    },
  });

  // Add to queue
  await alertQueue.add("send-alert", {
    alertId: alert.id,
    title,
    message,
    recipient,
  });

  revalidatePath("/gov-dashboard");
}
