import fs from "fs";
import path from "path";

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
