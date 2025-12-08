import { prismaGov } from "@/lib/db/gov";
import GovDashboardClient from "@/components/dashboard/gov-dashboard-client";

// Force dynamic rendering to prevent build-time database access
export const dynamic = "force-dynamic";

export default async function GovDashboard() {
  const alerts = await prismaGov.alert.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const reports = await prismaGov.pollutionReport.findMany({
    orderBy: { recordedAt: "desc" },
    take: 50,
  });

  const avgAqi =
    reports.length > 0
      ? Math.round(
          reports.reduce((acc, curr) => acc + curr.aqi, 0) / reports.length
        )
      : 185; // Mock avg

  return (
    <GovDashboardClient
      initialAlerts={alerts}
      initialReports={reports}
      avgAqi={avgAqi}
    />
  );
}
