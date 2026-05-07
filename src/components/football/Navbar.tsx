'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, Zap, Search } from 'lucide-react';
import ThemeToggle from '@/components/football/ThemeToggle';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from '@/components/ui/sheet';

const navLinks = [
  { label: 'Beranda', href: '#home' },
  { label: 'Live Score', href: '#live' },
  { label: 'Klasemen', href: '#standings' },
  { label: 'Transfer', href: '#transfer' },
];

function openSearchDialog() {
  window.dispatchEvent(new CustomEvent('goalzone:open-search'));
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
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
            {/* Search Bar */}
            <button
              type="button"
              onClick={openSearchDialog}
              className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-gray-500 hover:text-gray-300 transition-all group min-w-[180px]"
            >
              <Search className="w-3.5 h-3.5 text-gray-500 group-hover:text-neon transition-colors" />
              <span className="text-xs">Cari artikel, tim...</span>
              <kbd className="ml-auto hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] font-mono text-[9px] text-gray-500">
                ⌘K
              </kbd>
            </button>
            <div className="ml-1 pl-2 border-l border-gray-200 dark:border-white/10">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={openSearchDialog}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-72 bg-deep-800/95 dark:bg-deep-800/95 backdrop-blur-xl border-white/10 p-0"
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
