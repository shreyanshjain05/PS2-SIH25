import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@/lib/auth"; // Better Auth instance
import { citizenService } from "@/services/citizen";
import { businessService } from "@/services/business";
import { govService } from "@/services/gov";

const app = new Elysia({ prefix: "/api" })
  .use(cors({
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      origin: true // Allow all for dev
  }))
  // Global Auth Middleware (Gateway Layer)
  .derive(async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });
    
    return {
        user: session?.user,
        session: session?.session
    };
  })
  // Mount Services
  .use(citizenService)
  .use(businessService)
  .use(govService)
  // Health Check
  .get("/health", () => ({ status: "ok" }))
  
  // Legacy AQI Routes (Proxy to Python Server)
  .group('/aqi', (app) => app
    .get('/sites', async () => {
      try {
        const res = await fetch('http://localhost:8000/sites/');
        if (!res.ok) throw new Error('Failed to fetch sites');
        return await res.json();
      } catch (error) {
        return { error: 'Failed to connect to AQI server' };
      }
    })
    .post('/predict', async ({ body }) => {
      try {
        const res = await fetch('http://localhost:8000/predict/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        return await res.json();
      } catch (error) {
        return { error: 'Prediction failed' };
      }
    }, {
      body: t.Object({
        site_id: t.String(),
        data: t.Array(t.Any())
      })
    })
    .post('/forecast/timeseries', async ({ body }) => {
      try {
        const res = await fetch('http://localhost:8000/forecast/timeseries/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        return await res.json();
      } catch (error) {
        return { error: 'Forecast failed' };
      }
    }, {
      body: t.Object({
        site_id: t.String(),
        data: t.Array(t.Any()),
        historical_points: t.Optional(t.Number())
      })
    })
  );

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const DELETE = app.handle;

export type App = typeof app;
