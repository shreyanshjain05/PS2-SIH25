import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@/lib/auth"; // Better Auth instance
import { citizenService } from "@/services/citizen";
import { businessService } from "@/services/business";
import { govService } from "@/services/gov";
import { publicApiService } from "@/services/public-api";
import { prismaAuth } from "@/lib/db/auth";
import { logger } from "@/lib/logger";

// ML Service URL - use env var to support both local and Docker
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';


const aqiService = new Elysia({ prefix: '/aqi' })
    // Auth required but NO credits for internal AQI endpoints
    // Credits are only for /api/v1/* public API
    .onBeforeHandle(async (context: any) => {
        const { user, set } = context;
        if (!user) {
            set.status = 401;
            return { error: "Unauthorized - Please login to access AQI data" };
        }
        // No credit deduction for internal endpoints
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
    .post('/sample-data', async ({ body }: { body: any }) => {
      try {
        // Load sample data from the ML service's data directory
        const fs = await import('fs/promises');
        const path = await import('path');
        
        // Construct path to sample data file
        const siteId = body.site_id;
        const fileName = `${siteId}_unseen_input_data.csv`;
        
        // In production (Docker), access ML container's data
        // In development, access local ML data directory
        const dataPath = process.env.NODE_ENV === 'production'
          ? `/app/ML/Data_SIH_2025_with_blh/${fileName}`
          : path.join(process.cwd(), '..', 'ML', 'Data_SIH_2025_with_blh', fileName);
        
        const csvContent = await fs.readFile(dataPath, 'utf-8');
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',');
        
        const data = lines.slice(1).map(line => {
          const values = line.split(',');
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header.trim()] = values[i] ? parseFloat(values[i]) : null;
          });
          return obj;
        });
        
        return { data };
      } catch (error) {
        console.error('Sample data loading error:', error);
        return { error: `Failed to load sample data: ${error}` };
      }
    }, {
      body: t.Object({
        site_id: t.String()
      })
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
        // Load test payload from file
        const fs = await import('fs/promises');
        const path = await import('path');
        // In production (Docker), file is in /app/test_payload_2024.json
        // In development, file is in ../ML/test_payload_2024.json
        const testPayloadPath = process.env.NODE_ENV === 'production' 
          ? path.join(process.cwd(), 'test_payload_2024.json')
          : path.join(process.cwd(), '..', 'ML', 'test_payload_2024.json');
        const testPayloadContent = await fs.readFile(testPayloadPath, 'utf-8');
        const testPayload = JSON.parse(testPayloadContent);
        
        console.log('Using test payload with', testPayload.data.length, 'data points');
        
        const res = await fetch(`${ML_SERVICE_URL}/plots/timeseries/json/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });
        
        const mlData = await res.json();
        
        console.log('ML Service Response:', JSON.stringify(mlData, null, 2));
        console.log('ML Data keys:', Object.keys(mlData));
        console.log('Has dates?', 'dates' in mlData);
        console.log('Has historical?', 'historical' in mlData);
        console.log('Has forecast?', 'forecast' in mlData);
        
        // Transform ML response (dates, historical, forecast) to Frontend expected format (AqiData)
        if (mlData && mlData.dates) {
            const transformed = {
                historical_timestamps: mlData.dates,
                forecast_timestamps: mlData.dates,
                historical_O3_target: mlData.historical?.O3_target || [],
                historical_NO2_target: mlData.historical?.NO2_target || [],
                forecast_O3_target: mlData.forecast?.O3_target || [],
                forecast_NO2_target: mlData.forecast?.NO2_target || []
            };
            console.log('Transformed data sample:', {
                historical_timestamps_length: transformed.historical_timestamps.length,
                forecast_timestamps_length: transformed.forecast_timestamps.length,
                historical_O3_length: transformed.historical_O3_target.length,
                historical_NO2_length: transformed.historical_NO2_target.length,
                forecast_O3_length: transformed.forecast_O3_target.length,
                forecast_NO2_length: transformed.forecast_NO2_target.length
            });
            return transformed;
        }


        
        return mlData;
      } catch (error) {
        console.error('ML Service Error:', error);
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
  // Public API (API Key authenticated)
  .use(publicApiService)
  // Health Check
  .get("/health", () => ({ status: "ok" }))
  
  // Legacy AQI Routes (Proxy to Python Server)
  .use(aqiService);

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const DELETE = app.handle;

export type App = typeof app;