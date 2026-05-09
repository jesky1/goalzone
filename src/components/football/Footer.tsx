'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Twitter, Youtube, Instagram } from 'lucide-react';

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

const quickLinks = {
  Tim: [
    { label: 'Manchester City', href: '#' },
    { label: 'Real Madrid', href: '#' },
    { label: 'Barcelona', href: '#' },
    { label: 'Bayern Munich', href: '#' },
    { label: 'PSG', href: '#' },
  ],
  Media: [
    { label: 'Berita', href: '#home' },
    { label: 'Live Score', href: '#live' },
    { label: 'Klasemen', href: '#standings' },
    { label: 'Transfer', href: '#transfer' },
  ],
};

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
      <div className="glass-strong border-t border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-neon" />
                <span className="text-xl font-bold neon-text tracking-wider">
                  GOALZONE
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
                Portal berita sepak bola terkini dengan liputan lengkap liga-liga
                top dunia. Live score, klasemen, dan transfer terbaru.
              </p>
              {/* Social */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-neon hover:neon-border transition-all duration-300"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Leagues - Full 3-Column Grid */}
            <div className="sm:col-span-2 lg:col-span-2">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Liga</h4>
              <div className="glass-card p-4">
                <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                  {leagues.map((league) => (
                    <a
                      key={league.label}
                      href={league.href}
                      className="text-sm text-muted-foreground hover:text-neon transition-colors duration-200 py-1 truncate"
                    >
                      {league.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            {Object.entries(quickLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-neon transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Goalzone. Semua hak dilindungi.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-neon transition-colors">
                Privasi
              </a>
              <a href="#" className="hover:text-neon transition-colors">
                Ketentuan
              </a>
              <a href="#" className="hover:text-neon transition-colors">
                Kontak
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
