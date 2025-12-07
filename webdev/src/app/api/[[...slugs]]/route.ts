import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@/lib/auth"; // Better Auth instance
import { citizenService } from "@/services/citizen";
import { businessService } from "@/services/business";
import { govService } from "@/services/gov";
import { prismaAuth } from "@/lib/db/auth";
import { logger } from "@/lib/logger";

// ML Service URL - use env var to support both local and Docker
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';


const aqiService = new Elysia({ prefix: '/aqi' })
    .onBeforeHandle(async (context: any) => {
        const { request, user, set } = context;
        if (!user) {
            set.status = 401;
            return { error: "Unauthorized" };
        }
        try {
           const authHeader = request.headers.get("Authorization");
           const consume = await businessService.handle(new Request("http://localhost/business/credits/consume", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ userId: user.id, count: 100, resource: new URL(request.url).pathname })
           }));
           
           const result = await consume.json();
           if (!result.success) {
               set.status = 402; // Payment Required
               return { error: result.error || "Insufficient Credits" };
           }
        } catch (err) {
            console.error("Credit Deduction Failed:", err);
            set.status = 500;
            return { error: "Internal Server Error during Credit Check" };
        }
    })
    .get('/sites', async () => {
      try {
        const res = await fetch(`${ML_SERVICE_URL}/sites/`);
        if (!res.ok) throw new Error('Failed to fetch sites');
        return await res.json();
      } catch (error) {
        return { error: 'Failed to connect to AQI server' };
      }
    })
    .post('/predict', async ({ body }: { body: any }) => {
      try {
        const res = await fetch(`${ML_SERVICE_URL}/predict/`, {
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
    .post('/forecast/timeseries', async ({ body }: { body: any }) => {
      try {
        const res = await fetch(`${ML_SERVICE_URL}/forecast/timeseries/`, {
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
    });


const app = new Elysia({ prefix: "/api" })
  .use(cors({
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      origin: true // Allow all for dev
  }))
  .onRequest(({ request }) => {
    logger.info('API Request Started', { 
        type: 'api_request',
        method: request.method, 
        url: request.url,
        agent: request.headers.get('user-agent')
    });
  })
  // @ts-ignore - Using onAfterHandle as onResponse caused runtime issues in build
  .onAfterHandle(({ request, set }) => {
     logger.info('API Handled', { 
        type: 'api_response',
        method: request.method, 
        url: request.url,
        status: set.status
    });
  })

// ... (previous code)

  // Global Auth Middleware (Gateway Layer)
  .derive(async ({ request }: { request: Request }) => {
    // 1. Try Session Auth (Browser)
    const session = await auth.api.getSession({
        headers: request.headers,
    });
    
    if (session?.user) {
        return { user: session.user, session: session.session, authType: "SESSION" };
    }

    // 2. Try API Key Auth (Server/Client)
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const key = authHeader.split(" ")[1];
        
        try {
            // Use Better Auth's native verification to handle hashing correctly
            // @ts-ignore - The types might not expose verifyApiKey on the server instance directly in editor but it exists runtime
            const result = await auth.api.verifyApiKey({
                body: { key }
            });

            if (result?.valid && result?.key) {
                 // Fetch full user details if needed, or construct partial user
                 // The key object contains userId. derive expects a User object.
                 // We might need to fetch the user or trust the ID. 
                 // Let's assume we need to fetch the user to be safe and consistent with session.
                 const user = await prismaAuth.user.findUnique({
                     where: { id: result.key.userId }
                 });

                 if (user) {
                     return {
                         user: user,
                         session: null,
                         authType: "API_KEY"
                     };
                 }
            }
        } catch (err) {
            console.error("API Key Verification Error:", err);
        }
    }
    
    return {
        user: null,
        session: null,
        authType: "NONE"
    };
  })
  // Mount Services
  .use(citizenService)
  .use(businessService)
  .use(govService)
  // Health Check
  .get("/health", () => ({ status: "ok" }))
  
  // Legacy AQI Routes (Proxy to Python Server)
  .use(aqiService);

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const DELETE = app.handle;

export type App = typeof app;