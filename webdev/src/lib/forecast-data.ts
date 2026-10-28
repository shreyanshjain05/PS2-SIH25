import fs from "fs";
import path from "path";
import { CATEGORY_RANK, calculatePollutionScore } from "@/lib/aqi-utils";

// Precomputed by ML/aq_model/export.py. Bundled into the API function via
// outputFileTracingIncludes in next.config.ts.
const DATA_DIR = path.join(process.cwd(), "data", "forecasts");

type Hourly = (number | null)[];

interface SiteDay {
  kind: "backtest" | "forecast";
  gap: number | null; // days back to the observed day used as context
  O3_pred: Hourly;
  NO2_pred: Hourly;
  O3_actual?: Hourly;
  NO2_actual?: Hourly;
}

interface SiteFile {
  site: number;
  metrics: {
    O3: { mae: number; rmse: number; r2: number };
    NO2: { mae: number; rmse: number; r2: number };
  };
  days: Record<string, SiteDay>;
}

export interface ForecastSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  predictable_dates: string[];
}

let sitesCache: ForecastSite[] | null = null;
const siteCache = new Map<string, SiteFile>();

export function getForecastSites(): ForecastSite[] {
  if (!sitesCache) {
    sitesCache = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "sites.json"), "utf-8"));
  }
  return sitesCache!;
}

function getSiteFile(siteId: string): SiteFile | null {
  const id = siteId.replace(/^site_/, "").replace(/\.0$/, "");
  if (!/^\d+$/.test(id)) return null;
  if (!siteCache.has(id)) {
    const file = path.join(DATA_DIR, `site_${id}.json`);
    if (!fs.existsSync(file)) return null;
    siteCache.set(id, JSON.parse(fs.readFileSync(file, "utf-8")));
  }
  return siteCache.get(id)!;
}

const nulls = (): Hourly => Array(24).fill(null);

function hourStamps(date: string): string[] {
  return Array.from({ length: 24 }, (_, h) => `${date} ${String(h).padStart(2, "0")}:00:00`);
}

function previousDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface AlertHotspot {
  date: string;
  kind: "backtest" | "forecast";
  high_sites: string[]; // sites whose worst predicted hour is High or worse
  flagged_sites: number; // sites at Moderate or worse
}

let hotspotCache: AlertHotspot[] | null = null;

/**
 * Dates ranked by how many sites the model predicts at High or worse, using
 * the same thresholds the gov dashboard applies (calculatePollutionScore).
 */
export function getAlertHotspots(limit = 10): AlertHotspot[] {
  if (!hotspotCache) {
    const byDate = new Map<string, AlertHotspot>();
    for (const { id } of getForecastSites()) {
      const site = getSiteFile(id)!;
      for (const [date, day] of Object.entries(site.days)) {
        let worst = 0;
        for (let h = 0; h < 24; h++) {
          const o3 = day.O3_pred[h];
          const no2 = day.NO2_pred[h];
          if (o3 === null || no2 === null) continue;
          worst = Math.max(worst, CATEGORY_RANK[calculatePollutionScore(o3, no2).category] ?? 0);
        }
        const entry = byDate.get(date) ?? { date, kind: day.kind, high_sites: [], flagged_sites: 0 };
        if (worst >= CATEGORY_RANK.High) entry.high_sites.push(id);
        if (worst >= CATEGORY_RANK.Moderate) entry.flagged_sites++;
        // A date counts as a forecast if any site's value there is a true forecast
        if (day.kind === "forecast") entry.kind = "forecast";
        byDate.set(date, entry);
      }
    }
    hotspotCache = [...byDate.values()]
      .filter((h) => h.high_sites.length > 0)
      .sort((a, b) =>
        b.high_sites.length - a.high_sites.length ||
        b.flagged_sites - a.flagged_sites ||
        b.date.localeCompare(a.date)
      );
  }
  return hotspotCache.slice(0, limit);
}

export const MAX_RANGE_DAYS = 31;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates a site + inclusive date range and returns the matching days as
 * hourly rows. Errors come back as { error, status } so callers can reject
 * a request before charging for it.
 */
export function getForecastRange(siteId: string, start: string, end: string) {
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    return { error: "Dates must be YYYY-MM-DD", status: 400 } as const;
  }
  if (start > end) return { error: "start must be on or before end", status: 400 } as const;
  const spanDays = (Date.parse(end) - Date.parse(start)) / 86_400_000 + 1;
  if (!Number.isFinite(spanDays)) return { error: "Invalid date", status: 400 } as const;
  if (spanDays > MAX_RANGE_DAYS) {
    return { error: `Range too long: max ${MAX_RANGE_DAYS} days`, status: 400 } as const;
  }

  const site = getSiteFile(siteId);
  if (!site) return { error: `Unknown site ${siteId}`, status: 404 } as const;

  const dates = Object.keys(site.days).filter((d) => d >= start && d <= end).sort();
  if (dates.length === 0) {
    const all = Object.keys(site.days).sort();
    return {
      error: `No forecasts for site ${site.site} between ${start} and ${end}. Available: ${all[0]} to ${all[all.length - 1]}`,
      status: 404,
    } as const;
  }

  const days = dates.map((date) => {
    const day = site.days[date];
    return {
      date,
      // backtest: out-of-sample prediction for a measured day (actuals included)
      // forecast: prediction for a day with no measurements
      kind: day.kind,
      context_gap_days: day.gap,
      hours: hourStamps(date).map((time, h) => ({
        time,
        O3_pred: day.O3_pred[h],
        NO2_pred: day.NO2_pred[h],
        O3_actual: day.O3_actual?.[h] ?? null,
        NO2_actual: day.NO2_actual?.[h] ?? null,
      })),
    };
  });

  return { site_id: String(site.site), start, end, units: "µg/m³", model_metrics: site.metrics, days };
}

/**
 * Same shape the ML service's /forecast/by-date/ returned: the previous day's
 * observations (when there are any) as history, then the 24 forecast hours.
 */
export function getForecastTimeseries(siteId: string, date: string) {
  const site = getSiteFile(siteId);
  if (!site) return { error: `Unknown site ${siteId}` };
  const day = site.days[date];
  if (!day) return { error: `No forecast available for site ${siteId} on ${date}` };

  const prevDate = previousDate(date);
  const prev = site.days[prevDate];
  const hasHistory = !!prev?.O3_actual;

  const histDates = hasHistory ? hourStamps(prevDate) : [];
  const histO3 = hasHistory ? prev.O3_actual! : [];
  const histNO2 = hasHistory ? prev.NO2_actual! : [];
  const pad = (a: Hourly) => [...Array(histDates.length).fill(null), ...a];

  return {
    dates: [...histDates, ...hourStamps(date)],
    historical: { dates: histDates, O3_target: histO3, NO2_target: histNO2 },
    actual: {
      O3_target: [...histO3, ...(day.O3_actual ?? nulls())],
      NO2_target: [...histNO2, ...(day.NO2_actual ?? nulls())],
    },
    predicted: { O3_target: pad(day.O3_pred), NO2_target: pad(day.NO2_pred) },
    forecast: { O3_target: pad(day.O3_pred), NO2_target: pad(day.NO2_pred) },
    // Out-of-sample accuracy for this site, not a single day's 24 points
    metrics: site.metrics,
    metadata: {
      row_count: histDates.length + 24,
      kind: day.kind,
      context_gap_days: day.gap,
      has_actuals: !!day.O3_actual,
    },
  };
}
