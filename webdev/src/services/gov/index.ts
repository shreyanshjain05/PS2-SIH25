import { Elysia, t } from "elysia";
import { prismaGov } from "@/lib/db/gov";
import { alertQueue } from "@/lib/queue";

export const govService = new Elysia({ prefix: "/gov" })
    .get("/analytics", async ({ headers }) => {
        // Log access audit
        const userId = headers['x-user-id'];
        if (userId) {
             await prismaGov.auditLog.create({
                data: {
                    userId,
                    action: "VIEW_ANALYTICS",
                    resource: "analytics_dashboard",
                    ipAddress: "127.0.0.1" // Mock IP for now
                }
            });
        }

        return {
            totalCitizens: 0, // Mocked: Cannot access Citizen DB directly
            totalBusinesses: 0, // Mocked: Cannot access Business DB directly
            recentAlerts: [] // Retrieve from alert log if we have one
        };
    })
    .post("/alert", async ({ headers, body }: { headers: Record<string, string | undefined>, body: any }) => {
        await alertQueue.add("msg", body);
        return { status: "Alert queued", data: body };
    });
