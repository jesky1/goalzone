'use client';

import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Newspaper, ExternalLink, Zap } from 'lucide-react';

const adminNavLinks = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Auto News', href: '/admin/auto-news', icon: Newspaper },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
      <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center">
              <Zap className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-wider">GOALZONE</span>
              <span className="block text-[10px] text-slate-400 font-medium">Admin Panel</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1">
            {adminNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <link.icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer - View Site Link */}
          <div className="px-3 pb-4 pt-2 border-t border-slate-200">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Site
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
