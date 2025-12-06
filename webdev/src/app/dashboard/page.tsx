"use client"

import AqiDashboard from '@/components/dashboard/aqi-dashboard';
import { useSession } from '@/lib/auth-client';
import { redirect } from 'next/navigation';
export default function DashboardPage() {
  const session = useSession();
  if(!session.data?.user.id){
    redirect('/sign-in');
  }
  return (
    <div className="container mx-auto py-8">
      <AqiDashboard />
    </div>
  );
}