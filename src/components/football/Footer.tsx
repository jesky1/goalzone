'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Twitter, Youtube, Instagram } from 'lucide-react';

const leagues = [
  { label: 'Premier League', slug: 'premier-league' },
  { label: 'La Liga', slug: 'la-liga' },
  { label: 'Serie A', slug: 'serie-a' },
  { label: 'Bundesliga', slug: 'bundesliga' },
  { label: 'Ligue 1', slug: 'ligue-1' },
  { label: 'Eredivisie', slug: 'eredivisie' },
  { label: 'Liga Portugal', slug: 'liga-portugal' },
  { label: 'Primeira Liga', slug: 'primeira-liga' },
  { label: 'Belgian Pro League', slug: 'belgian-pro-league' },
  { label: 'Scottish Premiership', slug: 'scottish-premiership' },
  { label: 'Turkish Süper Lig', slug: 'turkish-super-lig' },
  { label: 'MLS', slug: 'mls' },
  { label: 'Liga MX', slug: 'liga-mx' },
  { label: 'Brasileirão', slug: 'brasileirao' },
  { label: 'Argentine Primera', slug: 'argentine-primera' },
  { label: 'Saudi Pro League', slug: 'saudi-pro-league' },
  { label: 'J-League', slug: 'j-league' },
  { label: 'K-League', slug: 'k-league' },
];

const teams = [
  { label: 'Manchester City', slug: 'manchester-city' },
  { label: 'Real Madrid', slug: 'real-madrid' },
  { label: 'Barcelona', slug: 'barcelona' },
  { label: 'Bayern Munich', slug: 'bayern-munich' },
  { label: 'PSG', slug: 'psg' },
];

const mediaLinks = [
  { label: 'Berita', href: '#home' },
  { label: 'Live Score', href: '#live' },
  { label: 'Klasemen', href: '#standings' },
  { label: 'Transfer', href: '#transfer' },
];

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mt-auto"
    >
      {/* ═══ FOOTER: Light = solid clean · Dark = cyberpunk glass ═══ */}
      <div className="bg-white dark:bg-white/[0.06] dark:backdrop-blur-xl border-t border-slate-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

            {/* ─── Brand ─────────────────────────────────── */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-sky-600 dark:text-neon" />
                <span className="text-xl font-bold text-slate-900 dark:text-neon dark:drop-shadow-[0_0_10px_rgba(0,240,255,0.5)] tracking-wider">
                  GOALZONE
                </span>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 max-w-xs">
                Portal berita sepak bola terkini dengan liputan lengkap liga-liga
                top dunia. Live score, klasemen, dan transfer terbaru.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/[0.06] dark:backdrop-blur-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-neon hover:bg-sky-50 dark:hover:bg-white/[0.1] dark:hover:shadow-[0_0_10px_rgba(0,240,255,0.15)] border border-slate-200 dark:border-white/[0.08] transition-all duration-300"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* ─── Leagues Grid ──────────────────────────── */}
            <div className="sm:col-span-2 lg:col-span-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Liga</h4>
              <div className="bg-slate-50 dark:bg-white/[0.04] dark:backdrop-blur-md rounded-xl p-4 border border-slate-200 dark:border-white/[0.08]">
                <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                  {leagues.map((league) => (
                    <Link
                      key={league.slug}
                      href={`/leagues/${league.slug}`}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-neon transition-colors duration-200 py-1 truncate"
                    >
                      {league.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Tim (Teams) ──────────────────────────── */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Tim</h4>
              <ul className="space-y-2.5">
                {teams.map((team) => (
                  <li key={team.slug}>
                    <Link
                      href={`/teams/${team.slug}`}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-neon transition-colors duration-200"
                    >
                      {team.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ─── Media ─────────────────────────────────── */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Media</h4>
              <ul className="space-y-2.5">
                {mediaLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-neon transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ─── Bottom Bar ─────────────────────────────── */}
          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} Goalzone. Semua hak dilindungi.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
              <a href="#" className="hover:text-sky-600 dark:hover:text-neon transition-colors">
                Privasi
              </a>
              <a href="#" className="hover:text-sky-600 dark:hover:text-neon transition-colors">
                Ketentuan
              </a>
              <a href="#" className="hover:text-sky-600 dark:hover:text-neon transition-colors">
                Kontak
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
