import { alertQueue } from "./src/lib/queue";

async function main() {
  console.log("Adding job to queue...");
  await alertQueue.add("send-alert", {
    alertId: "test-id",
    title: "Test Alert",
    message: "This is a test",
    recipient: "Test Recipient",
  });
  console.log("Job added.");
  process.exit(0);
}

main();
