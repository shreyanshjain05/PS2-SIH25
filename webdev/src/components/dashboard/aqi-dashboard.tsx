"use client";

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/eden';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, RefreshCw, MapPin, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface AqiData {
  historical_timestamps: string[];
  forecast_timestamps: string[];
  forecast_O3_target: number[];
  forecast_NO2_target: number[];
  historical_O3_target: number[];
  historical_NO2_target: number[];
}

export default function AqiDashboard() {
  const [sites, setSites] = useState<Record<string, { latitude: number; longitude: number }>>({});
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [forecastLimit, setForecastLimit] = useState(48);
  const [hoveredData, setHoveredData] = useState<any>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchSites = async () => {
      const { data, error } = await api.api.aqi.sites.get();
      if (data && !error) {
        // @ts-ignore
        setSites(data);
        // @ts-ignore
        const siteIds = Object.keys(data);
        if (siteIds.length > 0) setSelectedSite(siteIds[0]);
      }
    };
    fetchSites();
  }, []);

  const runForecast = async () => {
    if (!selectedSite) return;
    setLoading(true);
    
    try {
      // 1. Fetch real input data from our local API
      const sampleRes = await fetch('/api/aqi/sample-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site_id: selectedSite })
      });
      const sampleJson = await sampleRes.json();
      
      if (!sampleRes.ok || !sampleJson.data) {
          console.error("Failed to load sample data", sampleJson);
          return;
      }

      const inputData = sampleJson.data;

      // 2. Send this data to the forecast endpoint
      const { data, error } = await api.api.aqi.forecast.timeseries.post({
          site_id: selectedSite,
          data: inputData,
          historical_points: 72
      });

      if (data && !error) {
          const response = data as unknown as AqiData;
          if ('error' in response) {
              console.error("Server returned error:", (response as any).error);
              return;
          }

          if (!response.historical_timestamps || !Array.isArray(response.historical_timestamps)) {
              console.error("Invalid response format:", response);
              return;
          }

          const mergedData: any[] = [];
          
          // Combine historical data
          // If the server didn't return historical targets (because the input CSV didn't have them),
          // fallback to using the input features (O3_forecast, NO2_forecast) as the "historical" view.
          const hasServerHistory = response.historical_O3_target && response.historical_O3_target.length > 0;
          
          // We need to match the historical timestamps with the input data
          // The server returns the last N timestamps. We should take the last N records from inputData.
          const historyLength = response.historical_timestamps.length;
          const relevantInputData = inputData.slice(-historyLength);

          response.historical_timestamps.forEach((ts, idx) => {
              let o3Val = response.historical_O3_target?.[idx];
              let no2Val = response.historical_NO2_target?.[idx];

              // Fallback if server returned empty/null but we have input data
              if ((o3Val === undefined || o3Val === null) && relevantInputData[idx]) {
                  o3Val = relevantInputData[idx].O3_forecast;
              }
              if ((no2Val === undefined || no2Val === null) && relevantInputData[idx]) {
                  no2Val = relevantInputData[idx].NO2_forecast;
              }

              mergedData.push({
                  timestamp: new Date(ts).toLocaleString(),
                  rawTimestamp: new Date(ts).getTime(),
                  type: 'Historical',
                  O3: o3Val,
                  NO2: no2Val,
                  isForecast: false
              });
          });

          // Combine forecast data
          if (response.forecast_timestamps && Array.isArray(response.forecast_timestamps)) {
              response.forecast_timestamps.forEach((ts, idx) => {
                  mergedData.push({
                      timestamp: new Date(ts).toLocaleString(),
                      rawTimestamp: new Date(ts).getTime(),
                      type: 'Forecast',
                      O3_Forecast: response.forecast_O3_target?.[idx],
                      NO2_Forecast: response.forecast_NO2_target?.[idx],
                      isForecast: true
                  });
              });
          }

          setChartData(mergedData);
      }
    } catch (e) {
      console.error("Forecast error", e);
    } finally {
      setLoading(false);
    }
  };

  const historicalData = useMemo(() => {
    return chartData.filter(d => !d.isForecast);
  }, [chartData]);

  const forecastData = useMemo(() => {
    if (chartData.length === 0) return [];
    const forecast = chartData.filter(d => d.isForecast);
    // Limit forecast based on slider
    return forecast.slice(0, forecastLimit);
  }, [chartData, forecastLimit]);

  const handleMouseMove = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      setHoveredData(state.activePayload[0].payload);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Air Quality Forecast</h2>
            <p className="text-muted-foreground">Real-time AI predictions for Ozone and NO2 levels.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                    {Object.keys(sites).map(site => (
                        <SelectItem key={site} value={site}>{site}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={runForecast}
            disabled={loading || !selectedSite}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Run Forecast
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Forecast Horizon
            </CardTitle>
            <CardDescription>Adjust the time range for the forecast visualization (Next {forecastLimit} Hours)</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium w-12">1h</span>
                <Slider 
                    defaultValue={[48]} 
                    max={48} 
                    min={1} 
                    step={1} 
                    value={[forecastLimit]}
                    onValueChange={(vals) => setForecastLimit(vals[0])}
                    className="flex-1"
                />
                <span className="text-sm font-medium w-12">48h</span>
            </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Forecasted Ozone (O3) */}
        <Card>
            <CardHeader>
                <CardTitle>Forecasted Ozone (O3)</CardTitle>
                <CardDescription>Predicted O3 Levels (µg/m³)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full" style={{ height: 350, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData} onMouseMove={handleMouseMove}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis className="text-xs" />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                            labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="O3_Forecast" stroke="hsl(var(--chart-2))" name="Forecast O3" strokeWidth={2} dot={false} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Graph 2: Forecasted Nitrogen Dioxide (NO2) */}
        <Card>
            <CardHeader>
                <CardTitle>Forecasted Nitrogen Dioxide (NO2)</CardTitle>
                <CardDescription>Predicted NO2 Levels (µg/m³)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full" style={{ height: 350, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData} onMouseMove={handleMouseMove}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis className="text-xs" />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                            labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="NO2_Forecast" stroke="hsl(var(--chart-4))" name="Forecast NO2" strokeWidth={2} dot={false} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card className="mt-8 transition-all duration-200 ease-in-out">
        <CardHeader>
            <CardTitle>Forecast Details</CardTitle>
            <CardDescription>
                {hoveredData ? "Specific forecast values for the selected time." : "Hover over the charts above to see detailed forecast information."}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {hoveredData ? (
                <div className="space-y-4">
                    <p className="text-lg">
                        On <span className="font-semibold text-foreground">{hoveredData.timestamp}</span>, the forecasted conditions are:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hoveredData.O3_Forecast !== undefined && (
                            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card/50">
                                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Ozone (O3)</p>
                                    <p className="text-2xl font-bold">{hoveredData.O3_Forecast.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">µg/m³</span></p>
                                </div>
                            </div>
                        )}
                        {hoveredData.NO2_Forecast !== undefined && (
                            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card/50">
                                <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-4))]" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Nitrogen Dioxide (NO2)</p>
                                    <p className="text-2xl font-bold">{hoveredData.NO2_Forecast.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">µg/m³</span></p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-[120px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                    Move your cursor over the graphs to view details
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
