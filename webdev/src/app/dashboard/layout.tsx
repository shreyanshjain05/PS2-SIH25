import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-secondary/10 border-r p-6 hidden md:block">
        <div className="font-bold text-xl mb-8 flex items-center gap-2">
           <span>🌍</span> EcoTrack
        </div>
        <nav className="space-y-2 flex flex-col">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start font-medium">
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/plans">
            <Button variant="ghost" className="w-full justify-start font-medium">
              Plans & Billing
            </Button>
          </Link>
          <Link href="/dashboard/api-keys">
            <Button variant="ghost" className="w-full justify-start font-medium">
              API Keys
            </Button>
          </Link>
        </nav>
      </aside>
      
      {/* Mobile Nav Placeholder (Simple top bar for now) */}
      <div className="md:hidden p-4 border-b flex justify-between items-center bg-background">
         <div className="font-bold">EcoTrack</div>
         <div className="flex gap-2">
            <Link href="/dashboard/plans"><Button variant="outline" size="sm">Plans</Button></Link>
            <Link href="/dashboard"><Button variant="outline" size="sm">Home</Button></Link>
         </div>
      </div>

      <main className="flex-1 p-6">
          {children}
      </main>
    </div>
  )
}
