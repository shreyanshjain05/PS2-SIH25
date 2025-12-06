// app/api/[[...slugs]]/route.ts
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@/lib/auth";
import { govtGuard } from "@/middleware/auth";
import { NICGatewayService } from "@/services/nic-gateway";
import { prisma } from "@/lib/prisma";
import * as fs from "node:fs";
import * as path from "node:path";

const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: true, // Allow all origins for dev, or specify
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    })
  )
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  })
  .get("/", () => "Hello from Elysia + Next.js!")
  .post(
    "/",
    ({ body }) => {
      return { received: body };
    },
    {
      body: t.Object({
        name: t.String(),
        age: t.Number(),
      }),
    }
  )
  .group("/aqi", (app) =>
    app
      .get("/sites", async () => {
        try {
          const res = await fetch("http://localhost:8000/sites/");
          if (!res.ok) throw new Error("Failed to fetch sites");
          return await res.json();
        } catch (error) {
          console.error("Error fetching sites:", error);
          return { error: "Failed to connect to AQI server" };
        }
      })
      .post(
        "/predict",
        async ({ body }) => {
          try {
            const res = await fetch("http://localhost:8000/predict/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            return await res.json();
          } catch (error) {
            return { error: "Prediction failed" };
          }
        },
        {
          body: t.Object({
            site_id: t.String(),
            data: t.Array(t.Any()),
          }),
        }
      )
      .post(
        "/forecast/timeseries",
        async ({ body }) => {
          try {
            const res = await fetch(
              "http://localhost:8000/forecast/timeseries/",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              }
            );
            return await res.json();
          } catch (error) {
            return { error: "Forecast failed" };
          }
        },
        {
          body: t.Object({
            site_id: t.String(),
            data: t.Array(t.Any()),
            historical_points: t.Optional(t.Number()),
          }),
        }
      )
  )
  .group("/gov", (app) =>
    app
      .use(govtGuard)
      .get("/alerts", async () => {
        return await prisma.alertLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
        });
      })
      .get("/sites", async () => {
        try {
          // Path to lat_lon_sites.txt relative to webdev root
          // webdev is at c:\Users\Lenovo\OneDrive\Desktop\PS2-SIH25\webdev
          // file is at c:\Users\Lenovo\OneDrive\Desktop\PS2-SIH25\ML\Data_SIH_2025 2\lat_lon_sites.txt
          const filePath = path.join(
            process.cwd(),
            "../ML/Data_SIH_2025 2/lat_lon_sites.txt"
          );

          if (!fs.existsSync(filePath)) {
            console.error("Sites file not found at:", filePath);
            return [];
          }

          const content = fs.readFileSync(filePath, "utf-8");
          const lines = content.trim().split("\n").slice(1); // Skip header

          return lines
            .map((line) => {
              const parts = line.trim().split(/\s+/);
              // Handle potential varying whitespace or empty lines
              if (parts.length < 3) return null;

              const [site, lat, lon] = parts;
              return {
                id: site,
                name: `Site ${site} (${lat}, ${lon})`,
                lat,
                lon,
              };
            })
            .filter(Boolean);
        } catch (e) {
          console.error("Error reading sites file", e);
          return [];
        }
      })
      .post(
        "/broadcast-emergency",
        async (context) => {
          const { body, set, request } = context as any;

          // Robust session check
          const session = await auth.api.getSession({
            headers: request.headers,
          });
          const user = session?.user;

          if (!user) {
            set.status = 401;
            return { error: "Unauthorized: User not found" };
          }

          try {
            const { region, message } = body;

            // Call simulation service
            const result = await NICGatewayService.sendEmergencyBroadcast(
              region,
              message,
              user.id
            );

            // Log to Prisma
            if (!prisma.alertLog) {
              console.error(
                "CRITICAL: prisma.alertLog is undefined. The server needs a restart to pick up the new schema."
              );
              throw new Error(
                "Database model missing - Server Restart Required"
              );
            }

            await prisma.alertLog.create({
              data: {
                message,
                region,
                senderId: user.id,
              },
            });

            return result;
          } catch (e) {
            console.error("Error in broadcast-emergency:", e);
            set.status = 500;
            return { error: "Internal Server Error during broadcast" };
          }
        },
        {
          body: t.Object({
            region: t.String(),
            message: t.String(),
          }),
        }
      )
  );

// Export handler(s) for HTTP methods you want to support
export const GET = app.fetch;
export const POST = app.fetch;
// (Similarly for PUT, DELETE etc. if needed)

// same route file
export type App = typeof app;
