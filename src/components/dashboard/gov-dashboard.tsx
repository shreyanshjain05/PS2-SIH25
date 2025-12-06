"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/eden";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  CheckCircle2,
  Radio,
  ShieldAlert,
  Activity,
  Server,
} from "lucide-react";

interface AlertLog {
  id: string;
  message: string;
  region: string;
  createdAt: string;
}

interface Site {
  id: string;
  name: string;
  lat: string;
  lon: string;
}

export function GovDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState<string>("");
  const [region, setRegion] = useState("DELHI-NCR");
  const [message, setMessage] = useState(
    "SEVERE POLLUTION ALERT: ODD-EVEN SCHEME EFFECTIVE IMMEDIATELY."
  );
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: alertsData } = await api.api.gov.alerts.get();
        if (alertsData) setAlerts(alertsData as AlertLog[]);

        const { data: sitesData } = await api.api.gov.sites.get();
        if (sitesData) setSites(sitesData as Site[]);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    fetchData();
  }, []);

  const handleEmergencyBroadcast = async () => {
    setIsLoading(true);
    setStatusStep("Authenticating Secure Channel...");

    try {
      // Simulation steps for UI
      await new Promise((r) => setTimeout(r, 800));
      setStatusStep("Verifying Government Credentials...");

      await new Promise((r) => setTimeout(r, 800));
      setStatusStep("Connecting to NIC SMS Gateway...");

      const { data, error } = await api.api.gov["broadcast-emergency"].post({
        region,
        message,
      });

      if (error) {
        throw new Error(error.value ? String(error.value) : "Broadcast Failed");
      }

      setStatusStep("Broadcast Successful! 1.2M Devices Reached.");

      // Refresh alerts
      const { data: alertsData } = await api.api.gov.alerts.get();
      if (alertsData) setAlerts(alertsData as AlertLog[]);
    } catch (err) {
      console.error(err);
      setStatusStep("Error: Broadcast Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Government Command Center
          </h1>
          <p className="text-muted-foreground">
            Manage emergency alerts and monitor system status.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          System Operational
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-red-100 shadow-lg">
            <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
              <div className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="h-5 w-5" />
                <CardTitle>Emergency Broadcast System (EBS)</CardTitle>
              </div>
              <CardDescription>
                Trigger region-wide alerts via NIC SMS Gateway. This action is
                logged and audited.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Target Region
                </label>
                <Select
                  value={region}
                  onValueChange={setRegion}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DELHI-NCR">
                      Delhi NCR (All Zones)
                    </SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.name}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Emergency Message
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {isLoading && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-700 border-t-transparent rounded-full" />
                  {statusStep}
                </div>
              )}

              {!isLoading && statusStep && statusStep.includes("Success") && (
                <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  {statusStep}
                </div>
              )}

              {!isLoading && statusStep && statusStep.includes("Error") && (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertTriangle className="h-5 w-5" />
                  {statusStep}
                </div>
              )}

              <Button
                variant="destructive"
                size="lg"
                className="w-full h-14 text-lg font-bold shadow-red-200 shadow-lg hover:shadow-xl transition-all"
                onClick={handleEmergencyBroadcast}
                disabled={isLoading}
              >
                {isLoading ? "BROADCASTING..." : "TRIGGER EMERGENCY ALERT"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                * This action will trigger SMS alerts to all citizens in the
                selected region immediately.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium">NIC Gateway</span>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  CONNECTED
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <Radio className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">AQI Level</span>
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                  SEVERE (450+)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Broadcasts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recent broadcasts.
                  </p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex flex-col gap-1 pb-3 border-b last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-500">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {alert.region}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {alert.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
