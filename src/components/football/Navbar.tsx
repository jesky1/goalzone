'use client';

import { useState } from 'react';
import Link from 'next/link';
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
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-deep-900 border-b border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none"
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
                href={link.href}
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
                className="w-[480px] p-4 bg-white dark:bg-deep-800/95 backdrop-blur-xl border-slate-200 dark:border-white/10 rounded-xl shadow-lg"
              >
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 dark:neon-text">
                  Football Leagues
                </h4>
                <div className="grid grid-cols-3 gap-1">
                  {leagues.map((league) => (
                    <a
                      key={league.label}
                      href={league.href}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-neon hover:bg-white/5 transition-all duration-200 truncate"
                    >
                      {league.label}
                    </a>
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
                className="h-9 w-48 pl-9 pr-3 rounded-lg text-sm bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300"
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
                className="h-8 w-32 pl-8 pr-2 rounded-lg text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/40 transition-all duration-300"
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
                className="w-72 bg-white dark:bg-deep-800/95 backdrop-blur-xl border-slate-200 dark:border-white/10 p-0"
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
                            href={link.href}
                            className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-neon hover:bg-white/5 transition-all duration-300"
                          >
                            {link.label}
                          </a>
                        </SheetClose>
                      </motion.div>
                    ))}
                  </div>

                  {/* Mobile Leagues */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                      Football Leagues
                    </h4>
                    <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                      {leagues.map((league) => (
                        <SheetClose asChild key={league.label}>
                          <a
                            href={league.href}
                            className="block px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-neon hover:bg-white/5 transition-all duration-200 truncate"
                          >
                            {league.label}
                          </a>
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
