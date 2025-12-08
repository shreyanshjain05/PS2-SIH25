import { Elysia, t } from "elysia";
import { prismaBusiness } from "@/lib/db/business";
import { prismaAuth } from "@/lib/db/auth";
import { auth } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// ML Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// Credit costs for different endpoints
const CREDIT_COSTS = {
  SITES_LIST: 10,
  SAMPLE_DATA: 50,
  FORECAST: 100,
  TIMESERIES: 150,
} as const;

// Helper: Verify API Key and get user
async function verifyApiKey(authHeader: string | null): Promise<{
  valid: boolean;
  userId?: string;
  user?: any;
  error?: string;
}> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or invalid Authorization header. Use: Bearer <api_key>" };
  }

  const key = authHeader.split(" ")[1];

  try {
    // @ts-ignore - Better Auth's verifyApiKey
    const result = await auth.api.verifyApiKey({
      body: { key },
    });

    if (result?.valid && result?.key) {
      const user = await prismaAuth.user.findUnique({
        where: { id: result.key.userId },
      });

      if (user) {
        return { valid: true, userId: result.key.userId, user };
      }
    }

    return { valid: false, error: "Invalid API key" };
  } catch (err) {
    console.error("API Key verification error:", err);
    return { valid: false, error: "API key verification failed" };
  }
}

// Helper: Check and deduct credits
async function consumeCredits(
  userId: string,
  amount: number,
  resource: string
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  const business = await prismaBusiness.business.findUnique({
    where: { userId },
  });

  if (!business) {
    return { success: false, error: "No business account found. Please set up billing." };
  }

  if (business.credits < amount) {
    return {
      success: false,
      error: `Insufficient credits. Required: ${amount}, Available: ${business.credits}`,
    };
  }

  await prismaBusiness.$transaction([
    prismaBusiness.business.update({
      where: { userId },
      data: { credits: { decrement: amount } },
    }),
    prismaBusiness.usageLog.create({
      data: {
        businessId: business.id,
        amount: amount,
        action: "PUBLIC_API_CALL",
        resource: resource,
      },
    }),
  ]);

  return { success: true, remaining: business.credits - amount };
}

// Public API Service - All endpoints require API key
export const publicApiService = new Elysia({ prefix: "/v1" })
  // API Documentation / Info
  .get("/", () => ({
    name: "AQI Forecast Public API",
    version: "1.0.0",
    endpoints: {
      "GET /v1/sites": {
        description: "List all available monitoring sites",
        credits: CREDIT_COSTS.SITES_LIST,
      },
      "GET /v1/sites/:siteId/data": {
        description: "Get sample input data for a specific site",
        credits: CREDIT_COSTS.SAMPLE_DATA,
      },
      "POST /v1/forecast": {
        description: "Generate O3 and NO2 forecast for a site",
        credits: CREDIT_COSTS.FORECAST,
      },
      "POST /v1/forecast/timeseries": {
        description: "Get detailed timeseries forecast with historical data",
        credits: CREDIT_COSTS.TIMESERIES,
      },
      "GET /v1/credits": {
        description: "Check your remaining credits (free)",
        credits: 0,
      },
    },
    authentication: "Bearer token in Authorization header",
    example: "curl -H 'Authorization: Bearer YOUR_API_KEY' https://api.example.com/v1/sites",
  }))

  // Check Credits (Free - no charge)
  .get("/credits", async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    const authResult = await verifyApiKey(authHeader);

    if (!authResult.valid) {
      return { error: authResult.error, status: 401 };
    }

    const business = await prismaBusiness.business.findUnique({
      where: { userId: authResult.userId },
    });

    return {
      credits: business?.credits ?? 0,
      plan: business?.plan ?? "FREE",
    };
  })

  // List Sites
  .get("/sites", async ({ request, set }) => {
    const authHeader = request.headers.get("Authorization");
    const authResult = await verifyApiKey(authHeader);

    if (!authResult.valid) {
      set.status = 401;
      return { error: authResult.error };
    }

    // Consume credits
    const creditResult = await consumeCredits(
      authResult.userId!,
      CREDIT_COSTS.SITES_LIST,
      "/v1/sites"
    );

    if (!creditResult.success) {
      set.status = 402;
      return { error: creditResult.error };
    }

    try {
      const res = await fetch(`${ML_SERVICE_URL}/sites/`);
      if (!res.ok) throw new Error("Failed to fetch sites from ML service");
      const sites = await res.json();

      return {
        data: sites,
        credits_used: CREDIT_COSTS.SITES_LIST,
        credits_remaining: creditResult.remaining,
      };
    } catch (error) {
      return { error: "Failed to fetch sites" };
    }
  })

  // Get Sample Data for a Site
  .get("/sites/:siteId/data", async ({ request, params, set }) => {
    const authHeader = request.headers.get("Authorization");
    const authResult = await verifyApiKey(authHeader);

    if (!authResult.valid) {
      set.status = 401;
      return { error: authResult.error };
    }

    const creditResult = await consumeCredits(
      authResult.userId!,
      CREDIT_COSTS.SAMPLE_DATA,
      `/v1/sites/${params.siteId}/data`
    );

    if (!creditResult.success) {
      set.status = 402;
      return { error: creditResult.error };
    }

    try {
      // Normalize site ID
      let siteId = params.siteId;
      if (siteId.endsWith(".0")) {
        siteId = siteId.slice(0, -2);
      }
      if (!siteId.startsWith("site_")) {
        siteId = `site_${siteId}`;
      }

      const dataDir =
        process.env.ML_DATA_PATH ||
        path.resolve(process.cwd(), "..", "ML", "Data_SIH_2025_with_blh");
      const filePath = path.join(dataDir, `${siteId}_unseen_input_data.csv`);

      if (!fs.existsSync(filePath)) {
        set.status = 404;
        return { error: `Data not found for ${siteId}` };
      }

      const fileContent = fs.readFileSync(filePath, "utf-8");
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        cast: (value) => (value === "" ? null : value),
      });

      // Return last 100 records for sample
      const sampleRecords = records.slice(-100);

      return {
        site_id: siteId,
        total_records: records.length,
        sample_records: sampleRecords.length,
        data: sampleRecords,
        credits_used: CREDIT_COSTS.SAMPLE_DATA,
        credits_remaining: creditResult.remaining,
      };
    } catch (error) {
      console.error("Error loading site data:", error);
      return { error: "Failed to load site data" };
    }
  })

  // Generate Forecast
  .post(
    "/forecast",
    async ({ request, body, set }) => {
      const authHeader = request.headers.get("Authorization");
      const authResult = await verifyApiKey(authHeader);

      if (!authResult.valid) {
        set.status = 401;
        return { error: authResult.error };
      }

      const creditResult = await consumeCredits(
        authResult.userId!,
        CREDIT_COSTS.FORECAST,
        "/v1/forecast"
      );

      if (!creditResult.success) {
        set.status = 402;
        return { error: creditResult.error };
      }

      try {
        const res = await fetch(`${ML_SERVICE_URL}/predict/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const result = await res.json();

        return {
          ...result,
          credits_used: CREDIT_COSTS.FORECAST,
          credits_remaining: creditResult.remaining,
        };
      } catch (error) {
        return { error: "Forecast generation failed" };
      }
    },
    {
      body: t.Object({
        site_id: t.String(),
        data: t.Array(t.Any()),
      }),
    }
  )

  // Timeseries Forecast
  .post(
    "/forecast/timeseries",
    async ({ request, body, set }) => {
      const authHeader = request.headers.get("Authorization");
      const authResult = await verifyApiKey(authHeader);

      if (!authResult.valid) {
        set.status = 401;
        return { error: authResult.error };
      }

      const creditResult = await consumeCredits(
        authResult.userId!,
        CREDIT_COSTS.TIMESERIES,
        "/v1/forecast/timeseries"
      );

      if (!creditResult.success) {
        set.status = 402;
        return { error: creditResult.error };
      }

      try {
        const res = await fetch(`${ML_SERVICE_URL}/plots/timeseries/json/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const mlData = await res.json();

        // Transform response
        if (mlData && mlData.dates) {
          return {
            historical_timestamps: mlData.dates,
            forecast_timestamps: mlData.dates,
            historical_O3: mlData.historical?.O3_target || [],
            historical_NO2: mlData.historical?.NO2_target || [],
            forecast_O3: mlData.forecast?.O3_target || [],
            forecast_NO2: mlData.forecast?.NO2_target || [],
            credits_used: CREDIT_COSTS.TIMESERIES,
            credits_remaining: creditResult.remaining,
          };
        }

        return {
          ...mlData,
          credits_used: CREDIT_COSTS.TIMESERIES,
          credits_remaining: creditResult.remaining,
        };
      } catch (error) {
        return { error: "Timeseries forecast failed" };
      }
    },
    {
      body: t.Object({
        site_id: t.String(),
        data: t.Array(t.Any()),
        historical_points: t.Optional(t.Number()),
      }),
    }
  );

// Export type
export type PublicApiApp = typeof publicApiService;
