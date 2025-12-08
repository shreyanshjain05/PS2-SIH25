"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Copy, 
  Check, 
  Key, 
  Zap, 
  Shield, 
  Code2, 
  Terminal,
  BookOpen,
  CreditCard,
  MapPin,
  BarChart3,
  Clock
} from "lucide-react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://52.172.175.100:3000";

type CodeBlockProps = {
  code: string;
  language?: string;
};

function CodeBlock({ code, language = "bash" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white hover:bg-slate-800"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

type EndpointCardProps = {
  method: "GET" | "POST";
  path: string;
  description: string;
  credits: number;
  requestBody?: string;
  responseExample: string;
  parameters?: { name: string; type: string; description: string; required: boolean }[];
};

function EndpointCard({ method, path, description, credits, requestBody, responseExample, parameters }: EndpointCardProps) {
  return (
    <Card className="border border-slate-200/60 overflow-hidden">
      <CardHeader className="bg-slate-50/80 border-b border-slate-200/40 pb-4">
        <div className="flex items-center gap-3">
          <Badge 
            className={`font-mono text-xs px-2 py-1 ${
              method === "GET" 
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" 
                : "bg-blue-100 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {method}
          </Badge>
          <code className="text-sm font-semibold text-slate-800">{path}</code>
          <Badge variant="outline" className="ml-auto text-xs">
            <CreditCard className="h-3 w-3 mr-1" />
            {credits} credits
          </Badge>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {parameters && parameters.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Parameters</h4>
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              {parameters.map((param) => (
                <div key={param.name} className="flex items-start gap-2 text-sm">
                  <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">{param.name}</code>
                  <span className="text-slate-500">{param.type}</span>
                  {param.required && <Badge variant="destructive" className="text-[10px] px-1 py-0">required</Badge>}
                  <span className="text-slate-600">- {param.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {requestBody && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Request Body</h4>
            <CodeBlock code={requestBody} language="json" />
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Response</h4>
          <CodeBlock code={responseExample} language="json" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-teal-400" />
            <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30">v1.0</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">AQI Forecast API Documentation</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Access real-time air quality predictions for O₃ and NO₂ levels across multiple monitoring sites using our powerful ML-based forecasting API.
          </p>
          <div className="flex gap-4 mt-8">
            <Link href="/dashboard/api-keys">
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Key className="h-4 w-4 mr-2" />
                Get API Key
              </Button>
            </Link>
            <Link href="/dashboard/plans">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                <CreditCard className="h-4 w-4 mr-2" />
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500" />
            Quick Start
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-2 border-dashed border-slate-200 hover:border-teal-300 transition-colors">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-teal-600">1</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Get API Key</h3>
                <p className="text-sm text-slate-600">Generate your API key from the dashboard</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-dashed border-slate-200 hover:border-teal-300 transition-colors">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-teal-600">2</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Add Credits</h3>
                <p className="text-sm text-slate-600">Purchase credits to make API calls</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-dashed border-slate-200 hover:border-teal-300 transition-colors">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-teal-600">3</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Make Requests</h3>
                <p className="text-sm text-slate-600">Start calling the API endpoints</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900 border-0">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Your First API Call
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock 
                code={`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  ${API_BASE_URL}/api/v1/sites`}
              />
            </CardContent>
          </Card>
        </section>

        {/* Authentication */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            Authentication
          </h2>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-slate-600 mb-4">
                All API requests require authentication using a Bearer token in the Authorization header.
              </p>
              <CodeBlock 
                code={`Authorization: Bearer YOUR_API_KEY`}
              />
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Security Notice:</strong> Keep your API key secret. Do not expose it in client-side code or public repositories.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Credit System */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-purple-500" />
            Credit System
          </h2>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-slate-600 mb-6">
                Each API endpoint consumes a certain number of credits. Monitor your usage and top up as needed.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-3">Credit Costs</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">List Sites</span>
                      <Badge variant="secondary">10 credits</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Get Site Data</span>
                      <Badge variant="secondary">50 credits</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Generate Forecast</span>
                      <Badge variant="secondary">100 credits</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Timeseries Forecast</span>
                      <Badge variant="secondary">150 credits</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Check Credits</span>
                      <Badge className="bg-emerald-100 text-emerald-700">Free</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-3">Response Headers</h4>
                  <p className="text-sm text-slate-600 mb-2">
                    Each response includes credit information:
                  </p>
                  <CodeBlock 
                    code={`{
  "data": { ... },
  "credits_used": 10,
  "credits_remaining": 4990
}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* API Endpoints */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Code2 className="h-6 w-6 text-teal-500" />
            API Endpoints
          </h2>

          <Tabs defaultValue="sites" className="space-y-6">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="sites" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Sites
              </TabsTrigger>
              <TabsTrigger value="forecast" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Forecast
              </TabsTrigger>
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credits
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sites" className="space-y-6">
              <EndpointCard
                method="GET"
                path="/api/v1/sites"
                description="Retrieve a list of all available air quality monitoring sites"
                credits={10}
                responseExample={`{
  "data": {
    "site_1": { "name": "Delhi - Anand Vihar", "lat": 28.6469, "lon": 77.3164 },
    "site_2": { "name": "Delhi - ITO", "lat": 28.6280, "lon": 77.2410 },
    "site_3": { "name": "Delhi - Punjabi Bagh", "lat": 28.6683, "lon": 77.1319 }
  },
  "credits_used": 10,
  "credits_remaining": 4990
}`}
              />

              <EndpointCard
                method="GET"
                path="/api/v1/sites/:siteId/data"
                description="Get sample input data for a specific monitoring site"
                credits={50}
                parameters={[
                  { name: "siteId", type: "string", description: "Site identifier (e.g., '1' or 'site_1')", required: true }
                ]}
                responseExample={`{
  "site_id": "site_1",
  "total_records": 10000,
  "sample_records": 100,
  "data": [
    {
      "year": 2024, "month": 5, "day": 5, "hour": 0,
      "O3_forecast": 7.93, "NO2_forecast": 69.81,
      "T_forecast": 20.71, "q_forecast": 11.12,
      "u_forecast": -0.17, "v_forecast": -1.87,
      "w_forecast": -1.56, "blh_forecast": 32.83
    }
  ],
  "credits_used": 50,
  "credits_remaining": 4940
}`}
              />
            </TabsContent>

            <TabsContent value="forecast" className="space-y-6">
              <EndpointCard
                method="POST"
                path="/api/v1/forecast"
                description="Generate O₃ and NO₂ predictions based on input meteorological data"
                credits={100}
                requestBody={`{
  "site_id": "site_1",
  "data": [
    {
      "year": 2024, "month": 5, "day": 5, "hour": 0,
      "O3_forecast": 7.93, "NO2_forecast": 69.81,
      "T_forecast": 20.71, "q_forecast": 11.12,
      "u_forecast": -0.17, "v_forecast": -1.87,
      "w_forecast": -1.56, "blh_forecast": 32.83
    }
  ]
}`}
                responseExample={`{
  "site_id": "site_1",
  "predictions": {
    "O3_target": [45.2, 48.1, 52.3, ...],
    "NO2_target": [38.5, 35.2, 32.1, ...]
  },
  "credits_used": 100,
  "credits_remaining": 4840
}`}
              />

              <EndpointCard
                method="POST"
                path="/api/v1/forecast/timeseries"
                description="Get detailed timeseries forecast with historical context for visualization"
                credits={150}
                requestBody={`{
  "site_id": "site_1",
  "data": [...],
  "historical_points": 72
}`}
                responseExample={`{
  "historical_timestamps": [0, 1, 2, ...],
  "forecast_timestamps": [500, 501, 502, ...],
  "historical_O3": [42.1, 45.3, 48.2, ...],
  "historical_NO2": [35.2, 38.1, 36.5, ...],
  "forecast_O3": [52.3, 54.1, 51.8, ...],
  "forecast_NO2": [32.1, 30.5, 28.9, ...],
  "credits_used": 150,
  "credits_remaining": 4690
}`}
              />
            </TabsContent>

            <TabsContent value="credits" className="space-y-6">
              <EndpointCard
                method="GET"
                path="/api/v1/credits"
                description="Check your current credit balance and plan status (free - no credits consumed)"
                credits={0}
                responseExample={`{
  "credits": 5000,
  "plan": "STARTER"
}`}
              />
            </TabsContent>
          </Tabs>
        </section>

        {/* Error Handling */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock className="h-6 w-6 text-red-500" />
            Error Handling
          </h2>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <Badge className="bg-red-100 text-red-700 mb-2">401</Badge>
                    <h4 className="font-semibold text-red-800">Unauthorized</h4>
                    <p className="text-sm text-red-600 mt-1">Invalid or missing API key</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <Badge className="bg-amber-100 text-amber-700 mb-2">402</Badge>
                    <h4 className="font-semibold text-amber-800">Payment Required</h4>
                    <p className="text-sm text-amber-600 mt-1">Insufficient credits</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <Badge className="bg-slate-100 text-slate-700 mb-2">404</Badge>
                    <h4 className="font-semibold text-slate-800">Not Found</h4>
                    <p className="text-sm text-slate-600 mt-1">Resource doesn't exist</p>
                  </div>
                </div>

                <CodeBlock
                  code={`// Error Response Format
{
  "error": "Insufficient credits. Required: 100, Available: 50"
}`}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Code Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Code2 className="h-6 w-6 text-indigo-500" />
            Code Examples
          </h2>

          <Tabs defaultValue="curl" className="space-y-4">
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            </TabsList>

            <TabsContent value="curl">
              <Card>
                <CardContent className="pt-6">
                  <CodeBlock
                    code={`# List all sites
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  ${API_BASE_URL}/api/v1/sites

# Get site data
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  ${API_BASE_URL}/api/v1/sites/1/data

# Generate forecast
curl -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"site_id": "site_1", "data": [...]}' \\
  ${API_BASE_URL}/api/v1/forecast`}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="python">
              <Card>
                <CardContent className="pt-6">
                  <CodeBlock
                    code={`import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "${API_BASE_URL}/api/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# List sites
response = requests.get(f"{BASE_URL}/sites", headers=headers)
sites = response.json()

# Get site data
response = requests.get(f"{BASE_URL}/sites/1/data", headers=headers)
site_data = response.json()

# Generate forecast
payload = {
    "site_id": "site_1",
    "data": site_data["data"]
}
response = requests.post(f"{BASE_URL}/forecast", 
                         headers=headers, 
                         json=payload)
forecast = response.json()
print(f"Credits remaining: {forecast['credits_remaining']}")`}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="javascript">
              <Card>
                <CardContent className="pt-6">
                  <CodeBlock
                    code={`const API_KEY = "YOUR_API_KEY";
const BASE_URL = "${API_BASE_URL}/api/v1";

const headers = {
  "Authorization": \`Bearer \${API_KEY}\`,
  "Content-Type": "application/json"
};

// List sites
const sitesRes = await fetch(\`\${BASE_URL}/sites\`, { headers });
const sites = await sitesRes.json();

// Get site data
const dataRes = await fetch(\`\${BASE_URL}/sites/1/data\`, { headers });
const siteData = await dataRes.json();

// Generate forecast
const forecastRes = await fetch(\`\${BASE_URL}/forecast\`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    site_id: "site_1",
    data: siteData.data
  })
});
const forecast = await forecastRes.json();
console.log(\`Credits remaining: \${forecast.credits_remaining}\`);`}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Support */}
        <section>
          <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200/50">
            <CardContent className="pt-6 text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Need Help?</h3>
              <p className="text-slate-600 mb-4">
                Contact our support team or check out our community resources.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline">
                  View FAQ
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm">
          <p>© 2025 AQI Forecast API. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
