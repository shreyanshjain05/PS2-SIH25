"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/eden";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import {
  Loader2,
  RefreshCw,
  MapPin,
  CalendarClock,
  TrendingUp,
  Wind,
  Activity,
  BarChart3,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parse } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { getSiteName } from "@/lib/sites";

// New API response format matching ML service
export interface AqiData {
  // New format fields
  dates?: string[];
  // Historical data (past observations before forecast period)
  historical?: {
    dates: string[];
    O3_target: (number | null)[];
    NO2_target: (number | null)[];
  };
  actual?: {
    O3_target: (number | null)[];
    NO2_target: (number | null)[];
  };
  predicted?: {
    O3_target: (number | null)[];
    NO2_target: (number | null)[];
  };
  forecast?: {
    O3_target: (number | null)[];
    NO2_target: (number | null)[];
  };
  metrics?: {
    O3: { mae: number; rmse: number; r2: number };
    NO2: { mae: number; rmse: number; r2: number };
  };
  // Legacy format fields for backward compatibility
  historical_timestamps?: number[];
  forecast_timestamps?: number[];
  historical_O3_target?: number[];
  historical_NO2_target?: number[];
  forecast_O3_target?: number[];
  forecast_NO2_target?: number[];
  metadata?: {
    row_count: number;
  };
  errors?: {
    O3_absolute_error: number[];
    NO2_absolute_error: number[];
  };
}

interface AqiDashboardProps {
  onForecastUpdate?: (data: AqiData, siteId: string) => void;
}

// Site data including predictable dates from API
interface Site {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  available_dates: (string | Date)[];
  predictable_dates: (string | Date)[];
}

export default function AqiDashboard({ onForecastUpdate }: AqiDashboardProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<AqiData["metrics"] | null>(null);
  const [forecastLimit, setForecastLimit] = useState(72);
  const [maxForecastHours, setMaxForecastHours] = useState(72);
  const [hoveredData, setHoveredData] = useState<any>(null);

  // Chart view mode: "actual-forecast" or "historical-forecast"
  const [o3ViewMode, setO3ViewMode] = useState<
    "actual-forecast" | "historical-forecast"
  >("historical-forecast");
  const [no2ViewMode, setNo2ViewMode] = useState<
    "actual-forecast" | "historical-forecast"
  >("historical-forecast");

  // Date selection state - for selecting date BEFORE running forecast
  const [forecastDate, setForecastDate] = useState<string>(
    new Date().toISOString().split("T")[0] // Default to today
  );
  // View mode for displaying results
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"full" | "daily">("full");

  const [isMounted, setIsMounted] = useState(false);

  // Safe date parsing helper
  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr || typeof dateStr !== "string") return undefined;
    try {
      const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
      return isNaN(parsed.getTime()) ? undefined : parsed;
    } catch {
      return undefined;
    }
  };

  // Safe date formatting helper
  const formatDateDisplay = (dateStr: string): string => {
    const parsed = parseDate(dateStr);
    if (!parsed) return "Select date";
    try {
      return format(parsed, "PPP");
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const fetchSites = async () => {
      const { data, error } = await api.api.aqi.sites.get();
      console.log("Sites API raw response:", { data, error, dataType: typeof data });
      if (data && !error) {
        // API returns array of sites with dates
        // Handle both direct array and wrapped response
        let sitesData: Site[];
        if (Array.isArray(data)) {
          sitesData = data as Site[];
        } else if (typeof data === 'object' && data !== null) {
          // Check if data is wrapped in some property
          const maybeArray = Object.values(data).find(v => Array.isArray(v));
          sitesData = (maybeArray as Site[]) || [];
        } else {
          sitesData = [];
        }
        
        console.log("Parsed sites data:", sitesData);
        console.log("First site:", sitesData[0]);
        console.log("First site predictable_dates:", sitesData[0]?.predictable_dates?.slice(0, 5));
        
        setSites(sitesData);
        if (sitesData.length > 0) {
          setSelectedSite(sitesData[0].id);
          // Set default date to first predictable date (convert Date to string if needed)
          const firstPredictableDate = sitesData[0].predictable_dates?.[0];
          if (firstPredictableDate) {
            const dateStr = firstPredictableDate instanceof Date 
              ? format(firstPredictableDate, 'yyyy-MM-dd')
              : typeof firstPredictableDate === 'string' 
                ? firstPredictableDate 
                : format(new Date(firstPredictableDate), 'yyyy-MM-dd');
            setForecastDate(dateStr);
          }
        }
      }
    };
    fetchSites();
  }, []);

  // Update forecastDate when site changes to first predictable date
  useEffect(() => {
    if (!selectedSite || sites.length === 0) return;
    const site = sites.find((s) => s.id === selectedSite);
    const firstPredictableDate = site?.predictable_dates?.[0];
    if (firstPredictableDate) {
      const dateStr = firstPredictableDate instanceof Date 
        ? format(firstPredictableDate, 'yyyy-MM-dd')
        : typeof firstPredictableDate === 'string' 
          ? firstPredictableDate 
          : format(new Date(firstPredictableDate), 'yyyy-MM-dd');
      setForecastDate(dateStr);
    }
  }, [selectedSite, sites]);

  // Get predictable dates for selected site as date strings
  const predictableDatesSet = useMemo(() => {
    if (!selectedSite || sites.length === 0) return new Set<string>();
    const site = sites.find((s) => s.id === selectedSite);
    const rawDates = site?.predictable_dates || [];
    
    // Convert dates to strings (handle both string and Date object formats)
    const dates = rawDates.map((d: string | Date) => {
      if (typeof d === 'string') return d;
      if (d instanceof Date) return format(d, 'yyyy-MM-dd');
      // Handle date-like objects
      try {
        const dateObj = new Date(d);
        return format(dateObj, 'yyyy-MM-dd');
      } catch {
        return null;
      }
    }).filter((d): d is string => d !== null);
    
    console.log("Predictable dates for site", selectedSite, ":", dates.length, "dates", dates.slice(0, 5));
    return new Set(dates);
  }, [selectedSite, sites]);

  // Get the year range from predictable dates for calendar dropdowns
  const { fromYear, toYear, fromDate, toDate } = useMemo(() => {
    if (predictableDatesSet.size === 0) {
      return { fromYear: 2019, toYear: 2025, fromDate: undefined, toDate: undefined };
    }
    const dates = Array.from(predictableDatesSet).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    // Ensure we have valid strings before splitting
    if (typeof firstDate !== 'string' || typeof lastDate !== 'string') {
      console.error("Invalid date format in predictableDatesSet:", { firstDate, lastDate });
      return { fromYear: 2019, toYear: 2025, fromDate: undefined, toDate: undefined };
    }
    
    return {
      fromYear: parseInt(firstDate.split("-")[0]),
      toYear: parseInt(lastDate.split("-")[0]),
      fromDate: parseDate(firstDate),
      toDate: parseDate(lastDate),
    };
  }, [predictableDatesSet]);

  // Check if a date is predictable (can be selected)
  const isDatePredictable = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return predictableDatesSet.has(dateStr);
  };

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

        if (onForecastUpdate) {
          onForecastUpdate(response, selectedSite);
        }

        console.log("Received response:", response);
        console.log("Historical data from API:", response.historical);

        // Store metrics if available
        if (response.metrics) {
          setMetrics(response.metrics);
        }

        // New format: dates, historical, actual, predicted, forecast
        const mergedData: any[] = [];

        if (response.dates && Array.isArray(response.dates)) {
          const dataLength = response.dates.length;
          setMaxForecastHours(dataLength);

          // Build a map of historical data by index for quick lookup
          const historicalDatesSet = new Set(response.historical?.dates || []);

          for (let i = 0; i < dataLength; i++) {
            const currentDate = response.dates[i];
            const actual_o3 = response.actual?.O3_target?.[i];
            const actual_no2 = response.actual?.NO2_target?.[i];
            const predicted_o3 = response.predicted?.O3_target?.[i];
            const predicted_no2 = response.predicted?.NO2_target?.[i];
            const forecast_o3 = response.forecast?.O3_target?.[i];
            const forecast_no2 = response.forecast?.NO2_target?.[i];

            // Check if this is a forecast point (forecast value exists and is not null)
            const isForecast =
              forecast_o3 !== null && forecast_o3 !== undefined;

            // Check if this date is in historical data
            const isHistorical =
              historicalDatesSet.has(currentDate) || !isForecast;

            // Get historical values from the dedicated historical object
            let historical_o3 = null;
            let historical_no2 = null;

            if (response.historical && response.historical.dates) {
              const histIndex = response.historical.dates.indexOf(currentDate);
              if (histIndex !== -1) {
                historical_o3 = response.historical.O3_target?.[histIndex];
                historical_no2 = response.historical.NO2_target?.[histIndex];
              }
            }

            // Fallback: use actual values for historical period if historical object not available
            if (historical_o3 === null && !isForecast) {
              historical_o3 = actual_o3;
            }
            if (historical_no2 === null && !isForecast) {
              historical_no2 = actual_no2;
            }

            mergedData.push({
              timestamp: `${i}h`,
              rawTimestamp: i,
              date: currentDate,
              type: isForecast ? "Forecast" : "Historical",
              // Historical values - past observations before forecast period
              O3: historical_o3,
              NO2: historical_no2,
              // Actual values - ground truth for ALL periods (for actual vs forecast comparison)
              O3_Actual: actual_o3,
              NO2_Actual: actual_no2,
              // Forecast values (model predictions - only in forecast period)
              O3_Forecast: forecast_o3,
              NO2_Forecast: forecast_no2,
              isForecast,
            });
          }

          console.log("Merged data with historical:", {
            total: mergedData.length,
            withHistoricalO3: mergedData.filter((d) => d.O3 !== null).length,
            withForecastO3: mergedData.filter((d) => d.O3_Forecast !== null)
              .length,
          });
        } else if (
          response.historical_timestamps &&
          Array.isArray(response.historical_timestamps)
        ) {
          // Fallback to legacy format
          const histLength = Math.min(
            response.historical_timestamps.length,
            response.historical_O3_target?.length || 0,
            response.historical_NO2_target?.length || 0
          );

          for (let i = 0; i < histLength; i++) {
            const ts = response.historical_timestamps[i];
            mergedData.push({
              timestamp: `${ts}h`,
              rawTimestamp: ts,
              type: "Historical",
              O3: response.historical_O3_target?.[i],
              NO2: response.historical_NO2_target?.[i],
              isForecast: false,
            });
          }

          if (
            response.forecast_timestamps &&
            Array.isArray(response.forecast_timestamps)
          ) {
            const forecastLength = Math.min(
              response.forecast_timestamps.length,
              response.forecast_O3_target?.length || 0,
              response.forecast_NO2_target?.length || 0
            );

            setMaxForecastHours(forecastLength);

            for (let i = 0; i < forecastLength; i++) {
              const ts = response.forecast_timestamps[i];
              mergedData.push({
                timestamp: `${ts}h`,
                rawTimestamp: ts,
                type: "Forecast",
                O3_Forecast: response.forecast_O3_target?.[i],
                NO2_Forecast: response.forecast_NO2_target?.[i],
                isForecast: true,
              });
            }
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

  const simulateForecast = () => {
    if (!selectedSite) return;
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Generate 120 dates (72 historical + 48 forecast)
      const totalPoints = 120;
      const historicalPoints = 72;
      const forecastPoints = 48;

      // Generate dates
      const dates = Array.from({ length: totalPoints }, (_, i) => {
        const date = new Date();
        date.setHours(date.getHours() + i - historicalPoints);
        return date.toISOString().slice(0, 16).replace("T", " ");
      });

      // Generate actual values for ALL points (historical + actual ground truth for forecast period)
      // In real scenario, actual values in forecast period would be real measurements
      const actual_O3 = Array.from({ length: totalPoints }, (_, i) => {
        if (i < historicalPoints) {
          // Historical actual values
          return 40 + Math.random() * 20;
        } else {
          // Actual ground truth in forecast period (for comparison)
          const forecastIdx = i - historicalPoints;
          if (forecastIdx > 10 && forecastIdx < 15)
            return 105 + Math.random() * 15; // Actual spike
          return 48 + Math.random() * 18;
        }
      });
      const actual_NO2 = Array.from({ length: totalPoints }, (_, i) => {
        if (i < historicalPoints) {
          return 20 + Math.random() * 15;
        } else {
          const forecastIdx = i - historicalPoints;
          if (forecastIdx > 20 && forecastIdx < 25)
            return 45 + Math.random() * 12;
          return 23 + Math.random() * 12;
        }
      });

      // Generate forecast values (only for forecast period with spikes)
      const forecast_O3 = Array.from({ length: totalPoints }, (_, i) => {
        if (i < historicalPoints) return null;
        const forecastIdx = i - historicalPoints;
        if (forecastIdx > 10 && forecastIdx < 15)
          return 110 + Math.random() * 10; // Forecasted spike
        return 50 + Math.random() * 20;
      });
      const forecast_NO2 = Array.from({ length: totalPoints }, (_, i) => {
        if (i < historicalPoints) return null;
        const forecastIdx = i - historicalPoints;
        if (forecastIdx > 20 && forecastIdx < 25)
          return 50 + Math.random() * 10;
        return 25 + Math.random() * 10;
      });

      // Generate historical data object (only for historical period)
      const historical = {
        dates: dates.slice(0, historicalPoints),
        O3_target: actual_O3.slice(0, historicalPoints) as (number | null)[],
        NO2_target: actual_NO2.slice(0, historicalPoints) as (number | null)[],
      };

      // Simulated metrics
      const simulatedMetrics = {
        O3: { mae: 4.783, rmse: 7.099, r2: 0.9225 },
        NO2: { mae: 4.087, rmse: 5.338, r2: 0.9369 },
      };

      const response: AqiData = {
        dates,
        historical,
        actual: {
          O3_target: actual_O3 as (number | null)[],
          NO2_target: actual_NO2 as (number | null)[],
        },
        forecast: {
          O3_target: forecast_O3 as (number | null)[],
          NO2_target: forecast_NO2 as (number | null)[],
        },
        metrics: simulatedMetrics,
        metadata: { row_count: totalPoints },
        errors: {
          O3_absolute_error: [],
          NO2_absolute_error: [],
        },
      };

      if (onForecastUpdate) {
        onForecastUpdate(response, selectedSite);
      }

      // Save metrics
      setMetrics(response.metrics || null);

      const mergedData: any[] = [];

      // Build historical dates set for lookup
      const historicalDatesSet = new Set(historical.dates);

      // Merge all data points
      for (let i = 0; i < dates.length; i++) {
        const currentDate = dates[i];
        const actual_o3 = response.actual?.O3_target?.[i];
        const actual_no2 = response.actual?.NO2_target?.[i];
        const forecast_o3 = response.forecast?.O3_target?.[i];
        const forecast_no2 = response.forecast?.NO2_target?.[i];

        const isForecast = forecast_o3 !== null && forecast_o3 !== undefined;

        // Get historical values
        let hist_o3 = null;
        let hist_no2 = null;

        const histIndex = historical.dates.indexOf(currentDate);
        if (histIndex !== -1) {
          hist_o3 = historical.O3_target[histIndex];
          hist_no2 = historical.NO2_target[histIndex];
        }

        mergedData.push({
          timestamp: `${i}h`,
          rawTimestamp: i,
          date: currentDate,
          type: isForecast ? "Forecast" : "Historical",
          // Historical values - from the historical object
          O3: hist_o3,
          NO2: hist_no2,
          // Actual values - ground truth for ALL periods (for actual vs forecast comparison)
          O3_Actual: actual_o3,
          NO2_Actual: actual_no2,
          // Forecast values (model predictions for future)
          O3_Forecast: forecast_o3,
          NO2_Forecast: forecast_no2,
          isForecast,
        });
      }

      console.log("Simulated data with historical:", {
        total: mergedData.length,
        withHistoricalO3: mergedData.filter((d) => d.O3 !== null).length,
        withForecastO3: mergedData.filter((d) => d.O3_Forecast !== null).length,
      });

      // Set max forecast hours
      setMaxForecastHours(forecastPoints);
      setChartData(mergedData);
      setLoading(false);
    }, 1000);
  };

  const historicalData = useMemo(() => {
    return chartData.filter((d) => !d.isForecast);
  }, [chartData]);

  const forecastData = useMemo(() => {
    if (chartData.length === 0) return [];
    const forecast = chartData.filter((d) => d.isForecast);
    return forecast.slice(0, forecastLimit);
  }, [chartData, forecastLimit]);

  // Extract available dates from chart data
  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();
    chartData.forEach((d) => {
      if (d.date) {
        // Extract date part only (YYYY-MM-DD)
        const datePart = d.date.split(" ")[0];
        dateSet.add(datePart);
      }
    });
    return Array.from(dateSet).sort();
  }, [chartData]);

  // Check if a date can be selected (previous date must have data)
  const isDateSelectable = (dateStr: string): boolean => {
    const dateIndex = availableDates.indexOf(dateStr);
    // First date is always not selectable (no previous day)
    if (dateIndex <= 0) return false;
    // Check if previous date exists
    return true;
  };

  // Get selectable dates (dates where previous day also has data)
  const selectableDates = useMemo(() => {
    return availableDates.filter((date, index) => index > 0);
  }, [availableDates]);

  // Get the data filtered by selected date (24 hours)
  const dailyFilteredData = useMemo(() => {
    if (!selectedDate || viewMode !== "daily") return null;

    return chartData
      .filter((d) => {
        if (!d.date) return false;
        const datePart = d.date.split(" ")[0];
        return datePart === selectedDate;
      })
      .map((d, index) => ({
        ...d,
        // Override rawTimestamp to show 0-23 hours for daily view
        hourOfDay: index,
        displayHour: d.date.split(" ")[1]?.substring(0, 5) || `${index}:00`,
      }));
  }, [chartData, selectedDate, viewMode]);

  const combinedData = useMemo(() => {
    // If in daily view mode with a selected date, use filtered data
    if (
      viewMode === "daily" &&
      dailyFilteredData &&
      dailyFilteredData.length > 0
    ) {
      console.log(
        "Using daily filtered data for date:",
        selectedDate,
        "Points:",
        dailyFilteredData.length
      );
      return dailyFilteredData;
    }

    // Show ALL historical data plus forecast data for complete view
    // This allows viewing actual vs predicted on historical data, plus forecasts
    const combined = [...historicalData, ...forecastData];

    // Debug logging
    if (combined.length > 0) {
      const historicalO3Values = combined.filter(
        (d) => d.O3 !== null && d.O3 !== undefined
      );
      const forecastO3Values = combined.filter(
        (d) => d.O3_Forecast !== null && d.O3_Forecast !== undefined
      );

      console.log("Chart Data Debug:", {
        totalPoints: combined.length,
        historicalCount: historicalData.length,
        forecastCount: forecastData.length,
        historicalO3Count: historicalO3Values.length,
        forecastO3Count: forecastO3Values.length,
        sampleHistorical: historicalO3Values.slice(0, 2),
        sampleForecast: forecastO3Values.slice(0, 2),
      });
    }

    return combined;
  }, [historicalData, forecastData, viewMode, dailyFilteredData, selectedDate]);

  const stats = useMemo(() => {
    // Use daily filtered data if in daily view mode, otherwise use forecast data
    const dataForStats =
      viewMode === "daily" && dailyFilteredData && dailyFilteredData.length > 0
        ? dailyFilteredData
        : forecastData;

    if (dataForStats.length === 0) return null;

    // Get O3 values - prefer forecast values, fallback to historical/actual
    const o3Values = dataForStats
      .map((d) => d.O3_Forecast ?? d.O3 ?? d.O3_Actual)
      .filter((v) => v !== undefined && v !== null) as number[];
    const no2Values = dataForStats
      .map((d) => d.NO2_Forecast ?? d.NO2 ?? d.NO2_Actual)
      .filter((v) => v !== undefined && v !== null) as number[];

    if (o3Values.length === 0 || no2Values.length === 0) return null;

    return {
      o3: {
        min: Math.min(...o3Values),
        max: Math.max(...o3Values),
        avg: o3Values.reduce((a, b) => a + b, 0) / o3Values.length,
      },
      no2: {
        min: Math.min(...no2Values),
        max: Math.max(...no2Values),
        avg: no2Values.reduce((a, b) => a + b, 0) / no2Values.length,
      },
    };
  }, [forecastData, viewMode, dailyFilteredData]);

  const handleMouseMove = (state: any) => {
    console.log("handleMouseMove called, state:", state);
    if (state && state.activePayload && state.activePayload.length > 0) {
      const data = state.activePayload[0].payload;
      console.log("Mouse move data:", data);
      setHoveredData(data);
    } else {
      console.log("No activePayload in mouse move");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Air Quality Forecast
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-powered predictions for Ozone and NO2 levels with historical
            context
          </p>
        </div>

        {/* Step-by-step selection: 1. Date, 2. Site, 3. Forecast */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Run Forecast</CardTitle>
            <CardDescription>
              Select a date and location, then click Forecast to run the model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Step 1: Date Selection */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200/60 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                    <CalendarIcon className="w-4 h-4 text-indigo-600" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        Step 1: Forecast Date
                      </span>
                      <span className="text-slate-700 dark:text-slate-200 font-semibold text-base">
                        {sites.length === 0 ? "Loading..." : formatDateDisplay(forecastDate)}
                      </span>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {predictableDatesSet.size > 0 ? (
                    <Calendar
                      key={`calendar-${selectedSite}-${predictableDatesSet.size}`}
                      mode="single"
                      captionLayout="dropdown"
                      startMonth={fromDate}
                      endMonth={toDate}
                      defaultMonth={fromDate}
                      selected={parseDate(forecastDate)}
                      onSelect={(date) => {
                        if (date) {
                          setForecastDate(format(date, "yyyy-MM-dd"));
                          setCalendarOpen(false);
                        }
                      }}
                      disabled={(date) => !isDatePredictable(date)}
                      initialFocus
                    />
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading available dates...
                    </div>
                  )}
                  <div className="p-3 border-t text-xs text-muted-foreground">
                    {predictableDatesSet.size > 0 
                      ? `${predictableDatesSet.size} predictable dates available (${fromYear}-${toYear})`
                      : "Fetching dates from server..."}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Step 2: Site Selection */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-lg border border-teal-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                <MapPin className="w-4 h-4 text-teal-600" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    Step 2: Location
                  </span>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger className="border-0 text-slate-700 dark:text-slate-200 font-semibold text-base h-auto p-0 min-w-[150px]">
                      <SelectValue placeholder="Choose location" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {getSiteName(site.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Step 3: Run Forecast */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={runForecast}
                  disabled={loading || !selectedSite || !forecastDate}
                  className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-base"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Running..." : "Run Forecast"}
                </Button>
                <Button
                  onClick={simulateForecast}
                  disabled={loading || !selectedSite}
                  variant="outline"
                  className="border-teal-600 text-teal-600 hover:bg-teal-50 font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-base"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4 mr-2" />
                  )}
                  Simulate
                </Button>
              </div>
            </div>

            {/* Selected Values Summary */}
            {(forecastDate || selectedSite) && (
              <div className="mt-4 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <p className="text-sm text-muted-foreground">
                  <strong>Selected:</strong>{" "}
                  {forecastDate && (
                    <Badge variant="secondary" className="mr-2">
                      📅{" "}
                      {new Date(forecastDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Badge>
                  )}
                  {selectedSite && (
                    <Badge variant="secondary">
                      📍 {getSiteName(selectedSite)}
                    </Badge>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-500" />
                O3 Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.o3.avg.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">µg/m³</p>
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
              <div className="text-3xl font-bold">
                {stats.o3.min.toFixed(1)} - {stats.o3.max.toFixed(1)}
              </div>
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
              <div className="text-3xl font-bold text-purple-600">
                {stats.no2.avg.toFixed(1)}
              </div>
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
              <div className="text-3xl font-bold">
                {stats.no2.min.toFixed(1)} - {stats.no2.max.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">µg/m³</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Model Performance Metrics */}
      {metrics && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Model Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* O3 Metrics */}
            <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  O3 Model Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      MAE
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {metrics.O3.mae.toFixed(3)}
                    </p>
                    <p className="text-xs text-muted-foreground">µg/m³</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      RMSE
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {metrics.O3.rmse.toFixed(3)}
                    </p>
                    <p className="text-xs text-muted-foreground">µg/m³</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      R²
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(metrics.O3.r2 * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NO2 Metrics */}
            <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  NO2 Model Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      MAE
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {metrics.NO2.mae.toFixed(3)}
                    </p>
                    <p className="text-xs text-muted-foreground">µg/m³</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      RMSE
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {metrics.NO2.rmse.toFixed(3)}
                    </p>
                    <p className="text-xs text-muted-foreground">µg/m³</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      R²
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(metrics.NO2.r2 * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Forecast Horizon slider - only show in full view mode */}
      {viewMode === "full" && chartData.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              Forecast Horizon
            </CardTitle>
            <CardDescription>
              Adjust the time range for the forecast visualization (Next{" "}
              {forecastLimit} hours)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="w-16 justify-center">
                1h
              </Badge>
              <Slider
                defaultValue={[48]}
                max={maxForecastHours}
                min={1}
                step={1}
                value={[forecastLimit]}
                onValueChange={(vals) => setForecastLimit(vals[0])}
                className="flex-1"
              />
              <Badge variant="outline" className="w-20 justify-center">
                {maxForecastHours}h
              </Badge>
            </div>
            <p className="text-base text-center mt-3 text-muted-foreground">
              Showing {forecastData.length} of {maxForecastHours} forecast hours
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Options Card - for switching between full view and daily view */}
      {chartData.length > 0 && availableDates.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              View Options
            </CardTitle>
            <CardDescription>
              Switch between full forecast view or filter by specific day
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "full" ? "default" : "outline"}
                  onClick={() => {
                    setViewMode("full");
                    setSelectedDate(null);
                  }}
                  className="text-sm"
                >
                  Full Forecast View
                </Button>
                <Button
                  variant={viewMode === "daily" ? "default" : "outline"}
                  onClick={() => setViewMode("daily")}
                  className="text-sm"
                >
                  24-Hour Daily View
                </Button>
              </div>

              {viewMode === "daily" && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={selectedDate || ""}
                    onValueChange={(val) => setSelectedDate(val)}
                  >
                    <SelectTrigger className="w-[220px] bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Select a day to view" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableDates.map((date) => (
                        <SelectItem key={date} value={date}>
                          {new Date(date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedDate && (
                    <Badge
                      variant="secondary"
                      className="text-sm bg-indigo-100 dark:bg-indigo-900/50"
                    >
                      📊 Showing 24 hours for{" "}
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {viewMode === "daily" && !selectedDate && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Please select a specific date from the dropdown to view its
                24-hour data.
              </p>
            )}

            <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                <strong>Forecast data range:</strong> {availableDates[0]} to{" "}
                {availableDates[availableDates.length - 1]} (
                {availableDates.length} days total)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Graph 1: Ozone (O3) */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wind className="w-5 h-5 text-blue-500" />
                  Ozone (O3) Levels
                  {viewMode === "daily" && selectedDate && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/50"
                    >
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {viewMode === "daily" && selectedDate
                    ? `24-hour data for ${new Date(
                        selectedDate
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}`
                    : o3ViewMode === "actual-forecast"
                    ? "Actual vs Forecast comparison"
                    : "Historical vs Forecast comparison"}{" "}
                  (µg/m³)
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select
                  value={o3ViewMode}
                  onValueChange={(
                    val: "actual-forecast" | "historical-forecast"
                  ) => setO3ViewMode(val)}
                >
                  <SelectTrigger className="w-[200px] bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="historical-forecast">
                      Historical vs Forecast
                    </SelectItem>
                    <SelectItem value="actual-forecast">
                      Actual vs Forecast
                    </SelectItem>
                  </SelectContent>
                </Select>
                {stats && (
                  <div className="flex gap-2">
                    {o3ViewMode === "historical-forecast" ? (
                      <>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 dark:bg-blue-900/50"
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-600 mr-2" />
                          Historical
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-cyan-100 dark:bg-cyan-900/50"
                        >
                          <span className="w-2 h-2 rounded-full bg-cyan-600 mr-2" />
                          Forecast
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 dark:bg-green-900/50"
                        >
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                          Actual
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-cyan-100 dark:bg-cyan-900/50"
                        >
                          <span className="w-2 h-2 rounded-full bg-cyan-600 mr-2" />
                          Forecast
                        </Badge>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[400px] w-full" style={{ minHeight: 400 }}>
              {combinedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={combinedData}
                  onMouseMove={handleMouseMove}
                  onClick={(e: any) => {
                    console.log("O3 AreaChart click event:", e);
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const data = e.activePayload[0].payload;
                      console.log("Setting O3 data from chart click:", data);
                      setHoveredData(data);
                    }
                  }}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorO3Historical"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorO3Actual"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#22c55e"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorO3Forecast"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#06b6d4"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted/30"
                  />
                  <XAxis
                    dataKey={
                      viewMode === "daily" ? "hourOfDay" : "rawTimestamp"
                    }
                    tickFormatter={(val, index) => {
                      if (viewMode === "daily") {
                        const dataPoint = combinedData[index];
                        return dataPoint?.displayHour || `${val}:00`;
                      }
                      return `${val}h`;
                    }}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    className="text-sm"
                    stroke="hsl(var(--muted-foreground))"
                    label={{
                      value: "µg/m³",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      borderColor: "#e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px -1px rgb(0 0 0 / 0.15)",
                      padding: "12px",
                    }}
                    labelFormatter={(val, payload) => {
                      if (
                        viewMode === "daily" &&
                        payload &&
                        payload[0]?.payload?.displayHour
                      ) {
                        return `Time: ${payload[0].payload.displayHour}`;
                      }
                      return `Hour ${val}`;
                    }}
                    formatter={(value: any, name: string) => {
                      if (value === null || value === undefined)
                        return ["-", name];
                      return [`${Number(value).toFixed(2)} µg/m³`, name];
                    }}
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  {viewMode === "full" && historicalData.length > 0 && (
                    <ReferenceLine
                      x={
                        historicalData[historicalData.length - 1]?.rawTimestamp
                      }
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="3 3"
                      label={{
                        value: "Forecast Start",
                        position: "top",
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                      }}
                    />
                  )}
                  {/* Historical O3 - shown in historical-forecast mode */}
                  {o3ViewMode === "historical-forecast" && (
                    <Area
                      type="monotone"
                      dataKey="O3"
                      stroke="#3b82f6"
                      fill="url(#colorO3Historical)"
                      name="Historical O3"
                      strokeWidth={3}
                      dot={false}
                      connectNulls={false}
                    />
                  )}
                  {/* Actual O3 - shown in actual-forecast mode */}
                  {o3ViewMode === "actual-forecast" && (
                    <Area
                      type="monotone"
                      dataKey="O3_Actual"
                      stroke="#22c55e"
                      fill="url(#colorO3Actual)"
                      name="Actual O3"
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                    />
                  )}
                  {/* Forecast O3 - always shown */}
                  <Area
                    type="monotone"
                    dataKey="O3_Forecast"
                    stroke="#06b6d4"
                    fill="url(#colorO3Forecast)"
                    name="Forecast O3"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Run a forecast to see O3 data
                </div>
              )}
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
                  {viewMode === "daily" && selectedDate && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/50"
                    >
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {viewMode === "daily" && selectedDate
                    ? `24-hour data for ${new Date(
                        selectedDate
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}`
                    : no2ViewMode === "actual-forecast"
                    ? "Actual vs Forecast comparison"
                    : "Historical vs Forecast comparison"}{" "}
                  (µg/m³)
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select
                  value={no2ViewMode}
                  onValueChange={(
                    val: "actual-forecast" | "historical-forecast"
                  ) => setNo2ViewMode(val)}
                >
                  <SelectTrigger className="w-[200px] bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="historical-forecast">
                      Historical vs Forecast
                    </SelectItem>
                    <SelectItem value="actual-forecast">
                      Actual vs Forecast
                    </SelectItem>
                  </SelectContent>
                </Select>
                {stats && (
                  <div className="flex gap-2">
                    {no2ViewMode === "historical-forecast" ? (
                      <>
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 dark:bg-purple-900/50"
                        >
                          <span className="w-2 h-2 rounded-full bg-purple-600 mr-2" />
                          Historical
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-pink-100 dark:bg-pink-900/50"
                        >
                          <span className="w-2 h-2 rounded-full bg-pink-600 mr-2" />
                          Forecast
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 dark:bg-orange-900/50"
                        >
                          <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                          Actual
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-pink-100 dark:bg-pink-900/50"
                        >
                          <span className="w-2 h-2 rounded-full bg-pink-600 mr-2" />
                          Forecast
                        </Badge>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[400px] w-full" style={{ minHeight: 400 }}>
              {combinedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={combinedData}
                  onMouseMove={handleMouseMove}
                  onClick={(e: any) => {
                    console.log("NO2 AreaChart click event:", e);
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const data = e.activePayload[0].payload;
                      console.log("Setting NO2 data from chart click:", data);
                      setHoveredData(data);
                    }
                  }}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorNO2Historical"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
                      <stop
                        offset="95%"
                        stopColor="#a855f7"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorNO2Actual"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#f97316"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorNO2Forecast"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#ec4899"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted/30"
                  />
                  <XAxis
                    dataKey={
                      viewMode === "daily" ? "hourOfDay" : "rawTimestamp"
                    }
                    tickFormatter={(val, index) => {
                      if (viewMode === "daily") {
                        const dataPoint = combinedData[index];
                        return dataPoint?.displayHour || `${val}:00`;
                      }
                      return `${val}h`;
                    }}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    className="text-sm"
                    stroke="hsl(var(--muted-foreground))"
                    label={{
                      value: "µg/m³",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      borderColor: "#e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px -1px rgb(0 0 0 / 0.15)",
                      padding: "12px",
                    }}
                    labelFormatter={(val, payload) => {
                      if (
                        viewMode === "daily" &&
                        payload &&
                        payload[0]?.payload?.displayHour
                      ) {
                        return `Time: ${payload[0].payload.displayHour}`;
                      }
                      return `Hour ${val}`;
                    }}
                    formatter={(value: any, name: string) => {
                      if (value === null || value === undefined)
                        return ["-", name];
                      return [`${Number(value).toFixed(2)} µg/m³`, name];
                    }}
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  {viewMode === "full" && historicalData.length > 0 && (
                    <ReferenceLine
                      x={
                        historicalData[historicalData.length - 1]?.rawTimestamp
                      }
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="3 3"
                      label={{
                        value: "Forecast Start",
                        position: "top",
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                      }}
                    />
                  )}
                  {/* Historical NO2 - shown in historical-forecast mode */}
                  {no2ViewMode === "historical-forecast" && (
                    <Area
                      type="monotone"
                      dataKey="NO2"
                      stroke="#a855f7"
                      fill="url(#colorNO2Historical)"
                      name="Historical NO2"
                      strokeWidth={3}
                      dot={false}
                      connectNulls={false}
                    />
                  )}
                  {/* Actual NO2 - shown in actual-forecast mode */}
                  {no2ViewMode === "actual-forecast" && (
                    <Area
                      type="monotone"
                      dataKey="NO2_Actual"
                      stroke="#f97316"
                      fill="url(#colorNO2Actual)"
                      name="Actual NO2"
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                    />
                  )}
                  {/* Forecast NO2 - always shown */}
                  <Area
                    type="monotone"
                    dataKey="NO2_Forecast"
                    stroke="#ec4899"
                    fill="url(#colorNO2Forecast)"
                    name="Forecast NO2"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Run a forecast to see NO2 data
                </div>
              )}
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
            {hoveredData
              ? "Real-time values for the selected hour"
              : "Click or hover over the charts above to explore detailed information"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {hoveredData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <CalendarClock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-base text-muted-foreground">
                      Time Point
                    </p>
                    <p className="font-semibold text-xl">
                      {hoveredData.timestamp}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={hoveredData.isForecast ? "default" : "secondary"}
                  className="text-base px-4 py-2"
                >
                  {hoveredData.type}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(hoveredData.O3 !== undefined ||
                  hoveredData.O3_Forecast !== undefined) && (
                  <div className="group relative overflow-hidden rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-5 hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/10 rounded-full -mr-10 -mt-10" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <Wind className="w-5 h-5 text-blue-600" />
                        <p className="text-base font-medium text-blue-900 dark:text-blue-100">
                          Ozone (O3)
                        </p>
                        {hoveredData.isForecast && (
                          <Badge variant="outline" className="text-sm ml-auto">
                            Predicted
                          </Badge>
                        )}
                      </div>
                      <p className="text-5xl font-bold text-blue-600 mb-1">
                        {(hoveredData.O3_Forecast ?? hoveredData.O3)?.toFixed(
                          2
                        )}
                      </p>
                      <p className="text-base text-muted-foreground">µg/m³</p>
                    </div>
                  </div>
                )}
                {(hoveredData.NO2 !== undefined ||
                  hoveredData.NO2_Forecast !== undefined) && (
                  <div className="group relative overflow-hidden rounded-xl border-2 border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-5 hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/10 rounded-full -mr-10 -mt-10" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-purple-600" />
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          Nitrogen Dioxide (NO2)
                        </p>
                        {hoveredData.isForecast && (
                          <Badge variant="outline" className="text-sm ml-auto">
                            Predicted
                          </Badge>
                        )}
                      </div>
                      <p className="text-5xl font-bold text-purple-600 mb-1">
                        {(hoveredData.NO2_Forecast ?? hoveredData.NO2)?.toFixed(
                          2
                        )}
                      </p>
                      <p className="text-base text-muted-foreground">µg/m³</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5 hover:bg-muted/10 transition-colors">
              <Activity className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-base font-medium">Interactive Mode Active</p>
              <p className="text-sm mt-1">
                Click or hover over the time series charts to explore data
                points
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
