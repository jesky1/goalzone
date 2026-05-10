'use client';

<<<<<<< HEAD
import { useState } from 'react';
import Link from 'next/link';
=======
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
import { motion } from 'framer-motion';
import { Menu, Zap, Search, ChevronDown } from 'lucide-react';
import ThemeToggle from '@/components/football/ThemeToggle';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

const navLinks = [
  { label: 'Beranda', href: '#home' },
  { label: 'Live Score', href: '#live' },
  { label: 'Klasemen', href: '#standings' },
  { label: 'Transfer', href: '#transfer' },
];

const leagues = [
<<<<<<< HEAD
  { label: 'Premier League', href: '#' },
  { label: 'La Liga', href: '#' },
  { label: 'Serie A', href: '#' },
  { label: 'Bundesliga', href: '#' },
  { label: 'Ligue 1', href: '#' },
  { label: 'Eredivisie', href: '#' },
  { label: 'Liga Portugal', href: '#' },
  { label: 'Primeira Liga', href: '#' },
  { label: 'Belgian Pro League', href: '#' },
  { label: 'Scottish Premiership', href: '#' },
  { label: 'Turkish Süper Lig', href: '#' },
  { label: 'MLS', href: '#' },
  { label: 'Liga MX', href: '#' },
  { label: 'Brasileirão', href: '#' },
  { label: 'Argentine Primera', href: '#' },
  { label: 'Saudi Pro League', href: '#' },
  { label: 'J-League', href: '#' },
  { label: 'K-League', href: '#' },
=======
  { label: 'Premier League', href: '/leagues/premier-league' },
  { label: 'La Liga', href: '/leagues/la-liga' },
  { label: 'Serie A', href: '/leagues/serie-a' },
  { label: 'Bundesliga', href: '/leagues/bundesliga' },
  { label: 'Ligue 1', href: '/leagues/ligue-1' },
  { label: 'Champions League', href: '/leagues/champions-league' },
  { label: 'Europa League', href: '/leagues/europa-league' },
  { label: 'Eredivisie', href: '/leagues/eredivisie' },
  { label: 'Primeira Liga', href: '/leagues/primeira-liga' },
  { label: 'Belgian Pro League', href: '/leagues/belgian-pro-league' },
  { label: 'Scottish Premiership', href: '/leagues/scottish-premiership' },
  { label: 'Turkish Süper Lig', href: '/leagues/turkish-super-lig' },
  { label: 'MLS', href: '/leagues/mls' },
  { label: 'Liga MX', href: '/leagues/liga-mx' },
  { label: 'Brasileirão', href: '/leagues/brasileirao' },
  { label: 'Argentine Primera', href: '/leagues/argentine-primera' },
  { label: 'Saudi Pro League', href: '/leagues/saudi-pro-league' },
  { label: 'J-League', href: '/leagues/j-league' },
  { label: 'K-League', href: '/leagues/k-league' },
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
<<<<<<< HEAD
=======
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Handle navigation for section anchor links.
   * - If we're on the home page (/), smooth scroll to the section
   * - If we're on another page, navigate to /#section first
   * - Uses replace to avoid cluttering browser history
   */
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const sectionId = href.replace('#', '');

    if (pathname === '/') {
      // Already on home page — just scroll
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update URL hash without adding history entry
        history.replaceState(null, '', href);
      }
    } else {
      // On a different page — navigate to home with hash
      router.push(`/${href}`);
    }
  }, [pathname, router]);
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
<<<<<<< HEAD
      className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-deep-900 border-b border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none"
=======
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Zap className="w-6 h-6 text-neon neon-glow" />
            <span className="text-xl font-bold neon-text tracking-wider">
              GOALZONE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
<<<<<<< HEAD
                href={link.href}
=======
                href={pathname === '/' ? link.href : `/${link.href}`}
                onClick={(e) => handleNavClick(e, link.href)}
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-neon hover:bg-white/5 dark:hover:bg-white/5 transition-all duration-300"
              >
                {link.label}
              </a>
            ))}

            {/* League Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-neon hover:bg-white/5 dark:hover:bg-white/5 transition-all duration-300 flex items-center gap-1">
                  Liga
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
<<<<<<< HEAD
                className="w-[480px] p-4 bg-white dark:bg-deep-800/95 backdrop-blur-xl border-slate-200 dark:border-white/10 rounded-xl shadow-lg"
              >
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 dark:neon-text">
=======
                className="w-[480px] p-4 bg-deep-800/95 dark:bg-deep-800/95 backdrop-blur-xl border-white/10 rounded-xl"
              >
                <h4 className="text-sm font-bold text-white mb-3 neon-text">
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
                  Football Leagues
                </h4>
                <div className="grid grid-cols-3 gap-1">
                  {leagues.map((league) => (
<<<<<<< HEAD
                    <a
=======
                    <Link
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
                      key={league.label}
                      href={league.href}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-neon hover:bg-white/5 transition-all duration-200 truncate"
                    >
                      {league.label}
<<<<<<< HEAD
                    </a>
=======
                    </Link>
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Search Bar */}
            <div className="ml-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
<<<<<<< HEAD
                className="h-9 w-48 pl-9 pr-3 rounded-lg text-sm bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300"
=======
                className="h-9 w-48 pl-9 pr-3 rounded-lg text-sm backdrop-blur-md bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20 transition-all duration-300"
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
              />
            </div>

            <div className="ml-2 pl-2 border-l border-gray-200 dark:border-white/10">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
<<<<<<< HEAD
                className="h-8 w-32 pl-8 pr-2 rounded-lg text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/40 transition-all duration-300"
=======
                className="h-8 w-32 pl-8 pr-2 rounded-lg text-xs backdrop-blur-md bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon/40 transition-all duration-300"
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
              />
            </div>
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
<<<<<<< HEAD
                className="w-72 bg-white dark:bg-deep-800/95 backdrop-blur-xl border-slate-200 dark:border-white/10 p-0"
=======
                className="w-72 bg-deep-800/95 dark:bg-deep-800/95 backdrop-blur-xl border-white/10 p-0"
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col p-6">
                  <Link
                    href="/"
                    className="flex items-center gap-2 mb-8"
                    onClick={() => setIsOpen(false)}
                  >
                    <Zap className="w-6 h-6 text-neon" />
                    <span className="text-xl font-bold neon-text tracking-wider">
                      GOALZONE
                    </span>
                  </Link>
                  <div className="flex flex-col gap-1">
                    {navLinks.map((link, index) => (
                      <motion.div
                        key={link.href}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <SheetClose asChild>
                          <a
<<<<<<< HEAD
                            href={link.href}
=======
                            href={pathname === '/' ? link.href : `/${link.href}`}
                            onClick={(e) => {
                              handleNavClick(e, link.href);
                              setIsOpen(false);
                            }}
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
                            className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-neon hover:bg-white/5 transition-all duration-300"
                          >
                            {link.label}
                          </a>
                        </SheetClose>
                      </motion.div>
                    ))}
                  </div>

                  {/* Mobile Leagues */}
<<<<<<< HEAD
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
=======
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
                      Football Leagues
                    </h4>
                    <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                      {leagues.map((league) => (
                        <SheetClose asChild key={league.label}>
<<<<<<< HEAD
                          <a
                            href={league.href}
                            className="block px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-neon hover:bg-white/5 transition-all duration-200 truncate"
                          >
                            {league.label}
                          </a>
=======
                          <Link
                            href={league.href}
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-neon hover:bg-white/5 transition-all duration-200 truncate"
                          >
                            {league.label}
                          </Link>
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
