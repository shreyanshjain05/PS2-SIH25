"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AqiDashboard, { AqiData } from "@/components/dashboard/aqi-dashboard";
import {
  AlertTriangle,
  CheckCircle,
  Send,
  LayoutDashboard,
  History,
  Activity,
  Wind,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSiteName } from "@/lib/sites";
import { calculatePollutionScore } from "@/lib/aqi-utils";
import { sendAlert } from "@/app/gov-dashboard/actions";

interface GovDashboardClientProps {
  initialAlerts: any[];
  initialReports: any[];
  avgAqi: number;
}

export default function GovDashboardClient({
  initialAlerts,
  initialReports,
  avgAqi,
}: GovDashboardClientProps) {
  const [criticalRegions, setCriticalRegions] = useState<any[]>([]);
  const [alertedRegions, setAlertedRegions] = useState<Set<string>>(new Set());

  const handleForecastUpdate = (data: AqiData, siteId: string) => {
    // Handle both new format (forecast.O3_target) and legacy format (forecast_O3_target)
    const forecastO3 = data.forecast?.O3_target || data.forecast_O3_target || [];
    const forecastNO2 = data.forecast?.NO2_target || data.forecast_NO2_target || [];
    const forecastTimestamps = data.dates || data.forecast_timestamps || [];
    
    // Analyze forecast data for critical levels
    const forecastLength = Math.min(
      forecastO3.length,
      forecastNO2.length
    );

    let maxSeverity = 0;
    let worstCase = null;
    let trend = "Stable";

    // Check the next 48 hours (or available forecast)
    for (let i = 0; i < forecastLength; i++) {
      const o3 = forecastO3[i];
      const no2 = forecastNO2[i];
      
      // Skip null values (historical period in new format)
      if (o3 === null || o3 === undefined || no2 === null || no2 === undefined) continue;
      
      const score = calculatePollutionScore(o3, no2);

      if (score.score > maxSeverity) {
        maxSeverity = score.score;
        worstCase = {
          o3,
          no2,
          timestamp: forecastTimestamps[i],
          ...score,
        };
      }
    }

    // Determine trend based on first vs last forecast point
    // Find first and last non-null values
    const validIndices = forecastO3
      .map((val, idx) => (val !== null && val !== undefined ? idx : -1))
      .filter(idx => idx !== -1);
    
    if (validIndices.length > 1) {
      const firstIdx = validIndices[0];
      const lastIdx = validIndices[validIndices.length - 1];
      const firstScore = calculatePollutionScore(
        forecastO3[firstIdx] as number,
        forecastNO2[firstIdx] as number
      ).score;
      const lastScore = calculatePollutionScore(
        forecastO3[lastIdx] as number,
        forecastNO2[lastIdx] as number
      ).score;

      if (lastScore > firstScore) trend = "Rising";
      else if (lastScore < firstScore) trend = "Falling";
    }

    // If worst case is Moderate, High, Very High, or Severe, add to critical regions
    if (
      worstCase &&
      (worstCase.category === "Moderate" ||
        worstCase.category === "High" ||
        worstCase.category === "Very High" ||
        worstCase.category === "Severe")
    ) {
      const alertData = {
        id: `${siteId}-${Date.now()}`,
        region: siteId,
        o3: worstCase.o3,
        no2: worstCase.no2,
        recordedAt: new Date(), // Or the forecast time
        forecast: trend,
        aqi: worstCase.score, // Using score as proxy or calculate AQI if needed
        pollutant: worstCase.dominantPollutant,
        category: worstCase.category,
        riskFactors: worstCase.riskFactors,
        isSynergistic: worstCase.isSynergistic,
        details: {
          O3: {
            val: worstCase.o3.toFixed(1),
            level: calculatePollutionScore(worstCase.o3, 0).category,
          },
          NO2: {
            val: worstCase.no2.toFixed(1),
            level: calculatePollutionScore(0, worstCase.no2).category,
          },
        },
        forecastTime: worstCase.timestamp,
      };

      setCriticalRegions((prev) => {
        // Remove existing alert for this site if any, and add new one
        const filtered = prev.filter((r) => r.region !== siteId);
        return [alertData, ...filtered];
      });
    } else {
      // If it's no longer critical, remove it
      setCriticalRegions((prev) => prev.filter((r) => r.region !== siteId));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Government Command Center
          </h1>
          <p className="text-slate-500">
            Real-time pollution monitoring and alert management system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-sm bg-white">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Badge>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Alerts Sent
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialAlerts.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Zones
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {criticalRegions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Pollution Index
            </CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAqi}</div>
            <p className="text-xs text-muted-foreground">
              Moderate levels overall
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operational</div>
            <p className="text-xs text-muted-foreground">All sensors active</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Critical Alerts
            {criticalRegions.length > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
              >
                {criticalRegions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" /> Alert History
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Real-time Air Quality Monitoring</CardTitle>
              <CardDescription>
                Live data from monitoring stations across the region.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <AqiDashboard onForecastUpdate={handleForecastUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalRegions.map((region: any) => {
              const isAlertSent = alertedRegions.has(region.region);
              const regionName = getSiteName(region.region);

              let TrendIcon = Minus;
              let trendColor = "text-gray-500";
              if (region.forecast === "Rising") {
                TrendIcon = ArrowUpRight;
                trendColor = "text-red-500";
              } else if (region.forecast === "Falling") {
                TrendIcon = ArrowDownRight;
                trendColor = "text-green-500";
              }

              return (
                <Card
                  key={region.id}
                  className={`border-l-4 shadow-md hover:shadow-lg transition-shadow ${
                    isAlertSent
                      ? "border-l-gray-400 bg-gray-50"
                      : region.category === "Severe"
                      ? "border-l-purple-600 bg-red-50"
                      : region.category === "Moderate"
                      ? "border-l-yellow-500 bg-yellow-50"
                      : "border-l-red-500"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle
                        className={`text-lg font-bold flex items-center gap-2 ${
                          isAlertSent ? "text-gray-600" : "text-slate-800"
                        }`}
                      >
                        {isAlertSent ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertTriangle
                            className={`h-5 w-5 ${
                              region.category === "Severe"
                                ? "text-purple-600"
                                : region.category === "Moderate"
                                ? "text-yellow-500"
                                : "text-red-500"
                            }`}
                          />
                        )}
                        {regionName}
                      </CardTitle>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={isAlertSent ? "secondary" : "destructive"}
                          className={`text-sm ${
                            region.category === "Severe"
                              ? "bg-purple-600"
                              : region.category === "Moderate"
                              ? "bg-yellow-500 text-black hover:bg-yellow-600"
                              : ""
                          }`}
                        >
                          {region.category} Risk
                        </Badge>
                        <div
                          className={`flex items-center text-xs font-medium ${trendColor}`}
                        >
                          <TrendIcon className="h-3 w-3 mr-1" />
                          {region.forecast}
                        </div>
                      </div>
                    </div>
                    <CardDescription>
                      <span className="font-semibold block mb-1">
                        Dominant: {region.pollutant}
                        {region.isSynergistic && (
                          <Badge
                            variant="outline"
                            className="ml-2 border-purple-500 text-purple-700 bg-purple-50"
                          >
                            Synergistic Effect
                          </Badge>
                        )}
                      </span>
                      {region.details && (
                        <div className="grid grid-cols-2 gap-2 text-xs mt-2 bg-white p-2 rounded border">
                          <div>
                            <span className="font-medium">NO2:</span>{" "}
                            {region.details.NO2.val} ({region.details.NO2.level}
                            )
                          </div>
                          <div>
                            <span className="font-medium">O3:</span>{" "}
                            {region.details.O3.val} ({region.details.O3.level})
                          </div>
                        </div>
                      )}
                      {region.riskFactors && region.riskFactors.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-semibold text-slate-700">
                            Health Risks:
                          </p>
                          <ul className="list-disc list-inside text-xs text-slate-600">
                            {region.riskFactors.map(
                              (risk: string, idx: number) => (
                                <li key={idx}>{risk}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                      Recorded at: {region.recordedAt.toLocaleString()}
                    </div>
                    <form action={sendAlert} className="space-y-4">
                      <input
                        type="hidden"
                        name="title"
                        value={`${region.category} Pollution Alert: ${regionName}`}
                      />
                      <input
                        type="hidden"
                        name="category"
                        value={region.category}
                      />
                      <input
                        type="hidden"
                        name="pollutant"
                        value={region.pollutant}
                      />
                      <input
                        type="hidden"
                        name="riskFactors"
                        value={JSON.stringify(region.riskFactors)}
                      />
                      <input
                        type="hidden"
                        name="forecast"
                        value={region.forecast}
                      />
                      <input
                        type="hidden"
                        name="regionName"
                        value={regionName}
                      />
                      <input
                        type="hidden"
                        name="message"
                        value={`ALERT: ${
                          region.category
                        } pollution levels detected in ${regionName}. 
Dominant Pollutant: ${region.pollutant}. 
Risk Factors: ${region.riskFactors.join(" ")} 
Forecast: ${region.forecast}. 
Immediate action required.`}
                      />
                      <input
                        type="hidden"
                        name="severity"
                        value={
                          region.category === "Severe"
                            ? "CRITICAL"
                            : region.category === "Moderate"
                            ? "MEDIUM"
                            : "HIGH"
                        }
                      />
                      <input
                        type="hidden"
                        name="region"
                        value={region.region}
                      />

                      {!isAlertSent && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Target Departments
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              "Health Dept",
                              "Traffic Police",
                              "Education Board",
                              "Industrial Control",
                            ].map((dept) => (
                              <label
                                key={dept}
                                className="flex items-center space-x-2 text-xs border p-2 rounded hover:bg-slate-50 cursor-pointer bg-white"
                              >
                                <input
                                  type="checkbox"
                                  name="recipient"
                                  value={dept}
                                  defaultChecked
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-3 w-3"
                                />
                                <span>{dept}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {isAlertSent && (
                        <input
                          type="hidden"
                          name="recipient"
                          value="Previously Sent"
                        />
                      )}

                      <Button
                        type="submit"
                        disabled={isAlertSent}
                        onClick={() => {
                          setAlertedRegions((prev) =>
                            new Set(prev).add(region.region)
                          );
                        }}
                        className={`w-full shadow-sm ${
                          isAlertSent
                            ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                      >
                        {isAlertSent ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Alert Sent (Cooldown)
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Alert to Authorities
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              );
            })}
            {criticalRegions.length === 0 && (
              <div className="col-span-full p-12 text-center border-2 border-dashed rounded-lg bg-slate-50">
                <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                <h3 className="text-xl font-medium text-slate-900">
                  All Systems Normal
                </h3>
                <p className="text-slate-500 mt-2">
                  No critical pollution levels detected at this time.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Alert Log</CardTitle>
              <CardDescription>
                Comprehensive history of all alerts sent to authorities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">
                        {alert.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            alert.severity === "CRITICAL"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{alert.recipient}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {alert.status}
                        </div>
                      </TableCell>
                      <TableCell>{alert.createdAt.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {initialAlerts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No alerts sent yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
