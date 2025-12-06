import { Elysia, t } from "elysia";
import { prisma } from "@/lib/prisma";

export const businessService = new Elysia({ prefix: "/business" })
    .get("/data", async ({ headers, query }) => {
        const userId = headers['x-user-id'];
        // Check rate limit logic could go here or in gateway
        
        // Mock data response based on query
        return {
            type: query.type || "general",
            data: [
                { id: 1, value: 100, metric: "Air Quality Index" },
                { id: 2, value: 45, metric: "PM2.5" }
            ],
            timestamp: new Date()
        };
    });
