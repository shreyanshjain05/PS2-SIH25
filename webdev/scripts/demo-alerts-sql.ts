/**
 * Prints SQL that fills the gov alert log with alerts derived from the
 * model's predicted hotspots (data/forecasts), formatted like the ones the
 * gov dashboard's "Send Alert" button creates.
 *
 *   bun scripts/demo-alerts-sql.ts [count] | psql "$DATABASE_URL_GOV"
 */
import { calculatePollutionScore, severityKey } from "../src/lib/aqi-utils";
import { getAlertHotspots, getForecastTimeseries } from "../src/lib/forecast-data";
import { getSiteName } from "../src/lib/sites";

const count = parseInt(process.argv[2] ?? "8");
const recipients = [
  "Health Dept, Traffic Police",
  "Health Dept, Education Board",
  "Traffic Police, Industrial Control",
  "Health Dept, Traffic Police, Education Board",
];
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const rows: string[] = [];
outer: for (const spot of getAlertHotspots(20)) {
  // Rotate through the flagged sites so the log covers different regions
  const sites = spot.high_sites.map((_, i) => spot.high_sites[(i + rows.length) % spot.high_sites.length]);
  for (const siteId of sites) {
    const ts = getForecastTimeseries(siteId, spot.date);
    if ("error" in ts) continue;
    type Worst = ReturnType<typeof calculatePollutionScore> & { o3: number; no2: number; time: string };
    let w: Worst | null = null;
    for (let i = 0; i < ts.dates.length; i++) {
      const o3 = ts.forecast.O3_target[i];
      const no2 = ts.forecast.NO2_target[i];
      if (o3 === null || no2 === null) continue;
      const s = calculatePollutionScore(o3, no2);
      if (!w || severityKey(s) > severityKey(w)) w = { ...s, o3, no2, time: ts.dates[i] };
    }
    if (!w) continue;
    const name = getSiteName(siteId);
    const severity = w.category === "Severe" ? "CRITICAL" : w.category === "Moderate" ? "MEDIUM" : "HIGH";
    const message =
      `ALERT: ${w.category} pollution levels forecast in ${name} for ${w.time.slice(0, 13)}:00. ` +
      `Predicted O3 ${w.o3.toFixed(1)} µg/m³, NO2 ${w.no2.toFixed(1)} µg/m³. ` +
      `Dominant Pollutant: ${w.dominantPollutant}. Risk Factors: ${w.riskFactors.join(" ")} ` +
      `Immediate action required.`;
    const n = rows.length;
    const createdAt = `now() - interval '${n * 5 + 2} hours'`;
    rows.push(
      `(${q(`demo-${spot.date}-${siteId}`)}, ${q(`${w.category} Pollution Alert: ${name}`)}, ${q(message)}, ` +
        `${q(severity)}, ${q(siteId)}, ${q(recipients[n % recipients.length])}, 'SENT', ${createdAt}, ${createdAt})`
    );
    if (rows.length >= count) break outer;
    break; // one site per date keeps the log varied
  }
}

console.log(
  `INSERT INTO alerts (id, title, message, severity, region, recipient, status, "createdAt", "updatedAt") VALUES\n` +
    rows.join(",\n") +
    `\nON CONFLICT (id) DO NOTHING;`
);
