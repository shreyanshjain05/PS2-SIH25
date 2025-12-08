"use client";

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/eden';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { Loader2, RefreshCw, MapPin, CalendarClock, TrendingUp, Wind, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface AqiData {
  historical_timestamps: number[];
  forecast_timestamps: number[];
  historical_O3_target: number[];
  historical_NO2_target: number[];
  forecast_O3_target: number[];
  forecast_NO2_target: number[];
  metadata?: {
    row_count: number;
  };
  errors?: {
    O3_absolute_error: number[];
    NO2_absolute_error: number[];
  };
}



export default function AqiDashboard() {
  const [sites, setSites] = useState<
    Record<string, { latitude: number; longitude: number }>
  >({});
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [forecastLimit, setForecastLimit] = useState(48);
  const [maxForecastHours, setMaxForecastHours] = useState(48);
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
      const sampleRes = await fetch("/api/aqi/sample-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: selectedSite }),
      });
      const sampleJson = await sampleRes.json();

      if (!sampleRes.ok || !sampleJson.data) {
        console.error("Failed to load sample data", sampleJson);
        return;
      }

      const inputData = sampleJson.data;

      const { data, error } = await api.api.aqi.forecast.timeseries.post({
        site_id: selectedSite,
        data: inputData,
        historical_points: 72,
      });

      if (data && !error) {
        const response = data as unknown as AqiData;
        if ("error" in response) {
          console.error("Server returned error:", (response as any).error);
          return;
        }

          console.log("Received response:", response);

          const mergedData: any[] = [];
          
          // Handle historical data
          if (response.historical_timestamps && Array.isArray(response.historical_timestamps)) {
              const histLength = Math.min(
                  response.historical_timestamps.length,
                  response.historical_O3_target?.length || 0,
                  response.historical_NO2_target?.length || 0
              );
              
              for (let i = 0; i < histLength; i++) {
                  const ts = response.historical_timestamps[i];
                  
                  mergedData.push({
                      timestamp: `Hour ${ts}`,
                      rawTimestamp: ts,
                      type: 'Historical',
                      O3: response.historical_O3_target[i],
                      NO2: response.historical_NO2_target[i],
                      O3_Forecast: response.historical_O3_target[i],
                      NO2_Forecast: response.historical_NO2_target[i],
                      isForecast: false
                  });
              }
          }

          // Handle forecast data
          if (response.forecast_timestamps && Array.isArray(response.forecast_timestamps)) {
              const forecastLength = Math.min(
                  response.forecast_timestamps.length,
                  response.forecast_O3_target?.length || 0,
                  response.forecast_NO2_target?.length || 0
              );
              
              // Set max forecast hours
              setMaxForecastHours(forecastLength);
              
              for (let i = 0; i < forecastLength; i++) {
                  const ts = response.forecast_timestamps[i];
                  
                  mergedData.push({
                      timestamp: `Hour ${ts}`,
                      rawTimestamp: ts,
                      type: 'Forecast',
                      O3_Forecast: response.forecast_O3_target[i],
                      NO2_Forecast: response.forecast_NO2_target[i],
                      isForecast: true
                  });
              }
          }

          console.log("Merged data:", mergedData);
          setChartData(mergedData);
      }
    } catch (e) {
      console.error("Forecast error", e);
    } finally {
      setLoading(false);
    }
  };

  const historicalData = useMemo(() => {
    return chartData.filter((d) => !d.isForecast);
  }, [chartData]);

  const forecastData = useMemo(() => {
    if (chartData.length === 0) return [];
    const forecast = chartData.filter(d => d.isForecast);
    return forecast.slice(0, forecastLimit);
  }, [chartData, forecastLimit]);

  const combinedData = useMemo(() => {
    // Combine last few historical points with forecast for smooth transition
    const lastHistorical = historicalData.slice(-24);
    return [...lastHistorical, ...forecastData];
  }, [historicalData, forecastData]);

  const stats = useMemo(() => {
    if (forecastData.length === 0) return null;
    
    const o3Values = forecastData.map(d => d.O3_Forecast).filter(v => v !== undefined);
    const no2Values = forecastData.map(d => d.NO2_Forecast).filter(v => v !== undefined);
    
    return {
      o3: {
        min: Math.min(...o3Values),
        max: Math.max(...o3Values),
        avg: o3Values.reduce((a, b) => a + b, 0) / o3Values.length
      },
      no2: {
        min: Math.min(...no2Values),
        max: Math.max(...no2Values),
        avg: no2Values.reduce((a, b) => a + b, 0) / no2Values.length
      }
    };
  }, [forecastData]);

  const handleMouseMove = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      setHoveredData(state.activePayload[0].payload);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Air Quality Forecast</h2>
            <p className="text-muted-foreground mt-1">AI-powered predictions for Ozone and NO2 levels with historical context</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap min-w-fit">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300">
            <MapPin className="w-4 h-4 text-teal-600" />
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="border-0 text-slate-700 font-semibold text-sm h-auto p-0">
                <SelectValue placeholder="Choose location" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(sites).map((site) => (
                  <SelectItem key={site} value={site}>
                    {site}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={runForecast}
            disabled={loading || !selectedSite}
            className="bg-linear-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {loading ? "Running..." : "Forecast"}
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-500" />
                O3 Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.o3.avg.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">µg/m³</p>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                O3 Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.o3.min.toFixed(1)} - {stats.o3.max.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">µg/m³</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                NO2 Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.no2.avg.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">µg/m³</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                NO2 Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.no2.min.toFixed(1)} - {stats.no2.max.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">µg/m³</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Forecast Horizon
            </CardTitle>
            <CardDescription>Adjust the time range for the forecast visualization (Next {forecastLimit} hours)</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-4">
                <Badge variant="outline" className="w-16 justify-center">1h</Badge>
                <Slider 
                    defaultValue={[48]} 
                    max={maxForecastHours} 
                    min={1} 
                    step={1} 
                    value={[forecastLimit]}
                    onValueChange={(vals) => setForecastLimit(vals[0])}
                    className="flex-1"
                />
                <Badge variant="outline" className="w-20 justify-center">{maxForecastHours}h</Badge>
            </div>
            <p className="text-sm text-center mt-3 text-muted-foreground">
              Showing {forecastData.length} of {maxForecastHours} forecast hours
            </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Graph 1: Ozone (O3) */}
        <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wind className="w-5 h-5 text-blue-500" />
                      Ozone (O3) Levels
                    </CardTitle>
                    <CardDescription className="mt-1">Historical data and AI predictions (µg/m³)</CardDescription>
                  </div>
                  {stats && (
                    <div className="flex gap-4">
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/50">
                        <span className="w-2 h-2 rounded-full bg-blue-600 mr-2" />
                        Historical
                      </Badge>
                      <Badge variant="secondary" className="bg-cyan-100 dark:bg-cyan-900/50">
                        <span className="w-2 h-2 rounded-full bg-cyan-600 mr-2" style={{ borderStyle: 'dashed' }} />
                        Forecast
                      </Badge>
                    </div>
                  )}
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedData} onMouseMove={handleMouseMove} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorO3" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorO3Forecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis 
                            dataKey="rawTimestamp" 
                            tickFormatter={(val) => `H${val}`}
                            tick={{ fontSize: 11 }}
                            stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis 
                            className="text-xs" 
                            stroke="hsl(var(--muted-foreground))"
                            label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))', 
                              borderColor: 'hsl(var(--border))', 
                              borderRadius: '8px', 
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            labelFormatter={(val) => `Hour ${val}`}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        {historicalData.length > 0 && (
                          <ReferenceLine 
                            x={historicalData[historicalData.length - 1]?.rawTimestamp} 
                            stroke="hsl(var(--muted-foreground))" 
                            strokeDasharray="3 3"
                            label={{ value: 'Forecast Start', position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                        )}
                        <Area 
                            type="monotone" 
                            dataKey="O3" 
                            stroke="#3b82f6"
                            fill="url(#colorO3)"
                            name="Historical O3" 
                            strokeWidth={2.5} 
                            dot={false}
                            connectNulls 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="O3_Forecast" 
                            stroke="#06b6d4" 
                            fill="url(#colorO3Forecast)"
                            name="Forecast O3" 
                            strokeWidth={2.5} 
                            strokeDasharray="5 5"
                            dot={false}
                            connectNulls 
                        />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Graph 2: Nitrogen Dioxide (NO2) */}
        <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-500" />
                      Nitrogen Dioxide (NO2) Levels
                    </CardTitle>
                    <CardDescription className="mt-1">Historical data and AI predictions (µg/m³)</CardDescription>
                  </div>
                  {stats && (
                    <div className="flex gap-4">
                      <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/50">
                        <span className="w-2 h-2 rounded-full bg-purple-600 mr-2" />
                        Historical
                      </Badge>
                      <Badge variant="secondary" className="bg-pink-100 dark:bg-pink-900/50">
                        <span className="w-2 h-2 rounded-full bg-pink-600 mr-2" style={{ borderStyle: 'dashed' }} />
                        Forecast
                      </Badge>
                    </div>
                  )}
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedData} onMouseMove={handleMouseMove} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorNO2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorNO2Forecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis 
                            dataKey="rawTimestamp" 
                            tickFormatter={(val) => `H${val}`}
                            tick={{ fontSize: 11 }}
                            stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis 
                            className="text-xs" 
                            stroke="hsl(var(--muted-foreground))"
                            label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))', 
                              borderColor: 'hsl(var(--border))', 
                              borderRadius: '8px', 
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            labelFormatter={(val) => `Hour ${val}`}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        {historicalData.length > 0 && (
                          <ReferenceLine 
                            x={historicalData[historicalData.length - 1]?.rawTimestamp} 
                            stroke="hsl(var(--muted-foreground))" 
                            strokeDasharray="3 3"
                            label={{ value: 'Forecast Start', position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                        )}
                        <Area 
                            type="monotone" 
                            dataKey="NO2" 
                            stroke="#a855f7"
                            fill="url(#colorNO2)"
                            name="Historical NO2" 
                            strokeWidth={2.5} 
                            dot={false}
                            connectNulls 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="NO2_Forecast" 
                            stroke="#ec4899" 
                            fill="url(#colorNO2Forecast)"
                            name="Forecast NO2" 
                            strokeWidth={2.5} 
                            strokeDasharray="5 5"
                            dot={false}
                            connectNulls 
                        />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Interactive Data Point Details
            </CardTitle>
            <CardDescription>
                {hoveredData ? "Real-time values for the selected hour" : "Hover over the charts above to explore detailed information"}
            </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
            {hoveredData ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-3">
                            <CalendarClock className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">Time Point</p>
                                <p className="font-semibold text-lg">{hoveredData.timestamp}</p>
                            </div>
                        </div>
                        <Badge 
                            variant={hoveredData.isForecast ? "default" : "secondary"}
                            className="text-sm px-3 py-1"
                        >
                            {hoveredData.type}
                        </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(hoveredData.O3 !== undefined || hoveredData.O3_Forecast !== undefined) && (
                            <div className="group relative overflow-hidden rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-5 hover:shadow-lg transition-all duration-300">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/10 rounded-full -mr-10 -mt-10" />
                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Wind className="w-5 h-5 text-blue-600" />
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            Ozone (O3)
                                        </p>
                                        {hoveredData.isForecast && (
                                            <Badge variant="outline" className="text-xs ml-auto">Predicted</Badge>
                                        )}
                                    </div>
                                    <p className="text-4xl font-bold text-blue-600 mb-1">
                                        {(hoveredData.O3_Forecast ?? hoveredData.O3)?.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">µg/m³</p>
                                </div>
                            </div>
                        )}
                        {(hoveredData.NO2 !== undefined || hoveredData.NO2_Forecast !== undefined) && (
                            <div className="group relative overflow-hidden rounded-xl border-2 border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-5 hover:shadow-lg transition-all duration-300">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/10 rounded-full -mr-10 -mt-10" />
                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Activity className="w-5 h-5 text-purple-600" />
                                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                            Nitrogen Dioxide (NO2)
                                        </p>
                                        {hoveredData.isForecast && (
                                            <Badge variant="outline" className="text-xs ml-auto">Predicted</Badge>
                                        )}
                                    </div>
                                    <p className="text-4xl font-bold text-purple-600 mb-1">
                                        {(hoveredData.NO2_Forecast ?? hoveredData.NO2)?.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">µg/m³</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5 hover:bg-muted/10 transition-colors">
                    <Activity className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm font-medium">Interactive Mode Active</p>
                    <p className="text-xs mt-1">Hover over the time series charts to explore data points</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
