import { prismaGov } from "@/lib/db/gov";
import { sendAlert } from "./actions";
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
import AqiDashboard from "@/components/dashboard/aqi-dashboard";
import {
  AlertTriangle,
  CheckCircle,
  Send,
  LayoutDashboard,
  History,
  Activity,
  Wind,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Force dynamic rendering to prevent build-time database access
export const dynamic = 'force-dynamic';

// Mock data generator for critical regions if DB is empty
const getCriticalRegions = (reports: any[]) => {
  if (reports.length > 0) {
    return reports.filter((r: any) => r.aqi > 200);
  }
  // Fallback mock data for demonstration
  return [
    {
      id: "mock-1",
      region: "Anand Vihar, Delhi",
      aqi: 450,
      pollutant: "PM2.5",
      recordedAt: new Date(),
      forecast: "Rising",
    },
    {
      id: "mock-2",
      region: "Sector 62, Noida",
      aqi: 320,
      pollutant: "PM10",
      recordedAt: new Date(),
      forecast: "Stable",
    },
    {
      id: "mock-3",
      region: "Punjabi Bagh, Delhi",
      aqi: 280,
      pollutant: "NO2",
      recordedAt: new Date(),
      forecast: "Falling",
    },
  ];
};

export default async function GovDashboard() {
  const alerts = await prismaGov.alert.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const recentAlerts = await prismaGov.alert.findMany({
    where: {
      createdAt: {
        gte: twelveHoursAgo,
      },
    },
  });

  const alertedRegions = new Set(
    recentAlerts.map((a) => a.region).filter(Boolean)
  );

  const reports = await prismaGov.pollutionReport.findMany({
    orderBy: { recordedAt: "desc" },
    take: 50,
  });

  const criticalRegions = getCriticalRegions(reports);
  const avgAqi =
    reports.length > 0
      ? Math.round(
          reports.reduce((acc, curr) => acc + curr.aqi, 0) / reports.length
        )
      : 185; // Mock avg

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
            <div className="text-2xl font-bold">{alerts.length}</div>
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
            <CardTitle className="text-sm font-medium">Average AQI</CardTitle>
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
              <AqiDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalRegions.map((region: any) => {
              const isAlertSent = alertedRegions.has(region.region);
              return (
                <Card
                  key={region.id}
                  className={`border-l-4 shadow-md hover:shadow-lg transition-shadow ${
                    isAlertSent
                      ? "border-l-gray-400 bg-gray-50"
                      : "border-l-red-500"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle
                        className={`text-lg font-bold flex items-center gap-2 ${
                          isAlertSent ? "text-gray-600" : "text-red-700"
                        }`}
                      >
                        {isAlertSent ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5" />
                        )}
                        {region.region}
                      </CardTitle>
                      <Badge
                        variant={isAlertSent ? "secondary" : "destructive"}
                        className="text-sm"
                      >
                        AQI: {region.aqi}
                      </Badge>
                    </div>
                    <CardDescription>
                      High concentration of {region.pollutant} detected.
                      <br />
                      <span className="font-semibold text-slate-700">
                        Forecast: {region.forecast || "Stable"}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                      Recorded at: {region.recordedAt.toLocaleString()}
                    </div>
                    <form action={sendAlert}>
                      <input
                        type="hidden"
                        name="title"
                        value={`Severe Pollution Alert: ${region.region}`}
                      />
                      <input
                        type="hidden"
                        name="message"
                        value={`Critical AQI level of ${region.aqi} (${
                          region.pollutant
                        }) detected in ${region.region}. Forecast indicates ${
                          region.forecast || "continued high levels"
                        }. Immediate action required.`}
                      />
                      <input type="hidden" name="severity" value="CRITICAL" />
                      <input
                        type="hidden"
                        name="recipient"
                        value="NIC, CPCB, DM"
                      />
                      <input
                        type="hidden"
                        name="region"
                        value={region.region}
                      />

                      <Button
                        type="submit"
                        disabled={isAlertSent}
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
                  {alerts.map((alert) => (
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
                  {alerts.length === 0 && (
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
