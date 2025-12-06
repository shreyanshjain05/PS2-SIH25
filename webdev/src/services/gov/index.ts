import { Elysia, t } from "elysia";
import { prisma } from "@/lib/prisma";
import { alertQueue } from "@/lib/queue";

export const govService = new Elysia({ prefix: "/gov" })
    .get("/analytics", async ({ headers }) => {
        // Log access audit
        const userId = headers['x-user-id'];
        if (userId) {
             await prisma.auditLog.create({
                data: {
                    userId,
                    action: "VIEW_ANALYTICS",
                    resource: "analytics_dashboard",
                    ipAddress: "127.0.0.1" // Mock IP for now
                }
            });
        }

        return {
            totalCitizens: await prisma.citizen.count(),
            totalBusinesses: await prisma.business.count(),
            recentAlerts: [] // Retrieve from alert log if we have one
        };
    })
    .post("/alert", async ({ headers, body }: { headers: Record<string, string | undefined>, body: any }) => {
        await alertQueue.add("msg", body);
        return { status: "Alert queued", data: body };
    });
