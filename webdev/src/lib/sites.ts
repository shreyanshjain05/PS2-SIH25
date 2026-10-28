export interface MonitoringSite {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: string;
}

// Site IDs match ML service response (1.0, 2.0, etc.)
export const MONITORING_SITES: MonitoringSite[] = [
  {
    id: "1.0",
    name: "GT Karnal Road Industrial Area, Delhi",
    lat: 28.69536,
    lon: 77.18168,
    region: "North West Delhi",
  },
  {
    id: "2.0",
    name: "Dwarka, New Delhi",
    lat: 28.5718,
    lon: 77.07125,
    region: "New Delhi",
  },
  {
    id: "3.0",
    name: "Defence Colony, Delhi",
    lat: 28.58278,
    lon: 77.23441,
    region: "South East Delhi",
  },
  {
    id: "4.0",
    name: "Narela Industrial Complex, Delhi",
    lat: 28.82286,
    lon: 77.10197,
    region: "North Delhi",
  },
  {
    id: "5.0",
    name: "Govindpuri, Delhi",
    lat: 28.53077,
    lon: 77.27123,
    region: "South East Delhi",
  },
  {
    id: "6.0",
    name: "Rohini, Delhi",
    lat: 28.72954,
    lon: 77.09601,
    region: "North West Delhi",
  },
  {
    id: "7.0",
    name: "Karawal Nagar, Delhi",
    lat: 28.71052,
    lon: 77.24951,
    region: "North East Delhi",
  },
];

// Accepts "1", "1.0" or "site_1"
function findSite(siteId: string) {
  const num = siteId.replace(/^site_/, "").replace(/\.0$/, "");
  return MONITORING_SITES.find((s) => s.id.replace(/\.0$/, "") === num);
}

export function getSiteName(siteId: string): string {
  const site = findSite(siteId);
  return site ? site.name : siteId; // Fallback to ID if not found
}

export function getSiteCoordinates(siteId: string) {
  const site = findSite(siteId);
  return site ? { lat: site.lat, lon: site.lon } : null;
}
