import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-linear-to-br from-slate-50 via-white to-slate-100">
      {/* Sidebar - Compact & Sophisticated */}
      <aside className="w-full md:w-64 bg-slate-950 text-white px-5 py-6 hidden md:flex flex-col shadow-lg border-r border-slate-800/50">
        {/* Logo & Title */}
        <Link
          href="/dashboard"
          className="flex flex-col mb-8 group cursor-pointer"
        >
          <span className="font-bold text-xl text-white tracking-tight group-hover:text-teal-400 transition-colors duration-300">
            PRAKSAT <span className="text-teal-400 text-lg">MODEL</span>
          </span>
          <div className="h-0.5 w-10 bg-teal-500 rounded-full mt-2 group-hover:w-12 transition-all duration-300"></div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col flex-1 space-y-1">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold px-2 mt-5 mb-2">
            Main
          </div>
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-slate-300 hover:text-teal-300 hover:bg-slate-800/40 transition-colors duration-200 rounded-md py-2 px-3 group"
            >
              <span className="w-1 h-1 rounded-full bg-teal-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              Dashboard
            </Button>
          </Link>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold px-2 mt-4 mb-2">
            Account
          </div>
          <Link href="/dashboard/plans">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-slate-300 hover:text-teal-300 hover:bg-slate-800/40 transition-colors duration-200 rounded-md py-2 px-3 group"
            >
              <span className="w-1 h-1 rounded-full bg-teal-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              Plans & Billing
            </Button>
          </Link>
          <Link href="/dashboard/api-keys">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-slate-300 hover:text-teal-300 hover:bg-slate-800/40 transition-colors duration-200 rounded-md py-2 px-3 group"
            >
              <span className="w-1 h-1 rounded-full bg-teal-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              API Keys
            </Button>
          </Link>
        </nav>

        {/* Footer Section */}
        <div className="pt-4 border-t border-slate-800/30 mt-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/SIH2.webp"
              alt="SIH Logo"
              width={50}
              height={50}
              className="object-contain"
            />
            <Image
              src="/isro.svg"
              alt="ISRO Logo"
              width={50}
              height={50}
              className="object-contain brightness-0 invert"
            />
          </div>
          <p className="text-xs text-slate-500 text-center">v2.0</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden p-6 border-b border-slate-200/30 flex justify-between items-center bg-white/80 backdrop-blur-sm">
        <span className="font-extrabold text-xl text-slate-900">
          PRAKSAT <span className="text-teal-600">MODEL</span>
        </span>
        <div className="flex gap-3">
          <Link href="/dashboard/plans">
            <Button variant="outline" size="sm">
              Plans
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto bg-linear-to-br from-slate-50 via-white to-slate-100">
        {children}
      </main>
    </div>
  );
}
