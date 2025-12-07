export interface MonitoringSite {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: string;
}

export const MONITORING_SITES: MonitoringSite[] = [
  {
    id: "site_1",
    name: "GT Karnal Road Industrial Area, Delhi",
    lat: 28.69536,
    lon: 77.18168,
    region: "North West Delhi",
  },
  {
    id: "site_2",
    name: "Dwarka, New Delhi",
    lat: 28.5718,
    lon: 77.07125,
    region: "New Delhi",
  },
  {
    id: "site_3",
    name: "Defence Colony, Delhi",
    lat: 28.58278,
    lon: 77.23441,
    region: "South East Delhi",
  },
  {
    id: "site_4",
    name: "Narela Industrial Complex, Delhi",
    lat: 28.82286,
    lon: 77.10197,
    region: "North Delhi",
  },
  {
    id: "site_5",
    name: "Govindpuri, Delhi",
    lat: 28.53077,
    lon: 77.27123,
    region: "South East Delhi",
  },
  {
    id: "site_6",
    name: "Rohini, Delhi",
    lat: 28.72954,
    lon: 77.09601,
    region: "North West Delhi",
  },
  {
    id: "site_7",
    name: "Karawal Nagar, Delhi",
    lat: 28.71052,
    lon: 77.24951,
    region: "North East Delhi",
  },
];

export function getSiteName(siteId: string): string {
  const site = MONITORING_SITES.find((s) => s.id === siteId);
  return site ? site.name : siteId; // Fallback to ID if not found
}

export function getSiteCoordinates(siteId: string) {
  const site = MONITORING_SITES.find((s) => s.id === siteId);
  return site ? { lat: site.lat, lon: site.lon } : null;
}
