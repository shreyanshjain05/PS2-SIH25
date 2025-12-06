import { Elysia, t } from "elysia";
import { prismaCitizen } from "@/lib/db/citizen";

// Define the Citizen Service app
export const citizenService = new Elysia({ prefix: "/citizen" })
    .model({
        citizenProfile: t.Object({
            name: t.String(),
            phone: t.Optional(t.String()),
            address: t.Optional(t.String())
        })
    })
    // Get Profile
    .get("/profile", async ({ headers }) => {
        // In a real microservice, we'd validate the token here or trust the gateway
        // Here we rely on the gateway to pass the user ID. 
        // For simulation, let's assume `x-user-id` header is passed by Gateway.
        
        const userId = headers['x-user-id'];
        if (!userId) {
            throw new Error("Unauthorized: No user ID header");
        }

        const citizen = await prismaCitizen.citizen.findUnique({
            where: { userId },
            include: { documents: true }
        });

        return citizen || { message: "Profile not found" };
    })
    // Create/Update Profile
    .post("/profile", async ({ headers, body }) => {
        const userId = headers['x-user-id'];
        if (!userId) {
            throw new Error("Unauthorized: No user ID header");
        }

        const citizen = await prismaCitizen.citizen.upsert({
            where: { userId },
            update: body,
            create: {
                userId,
                ...body
            }
        });

        return citizen;
    }, {
        body: 'citizenProfile'
    });
