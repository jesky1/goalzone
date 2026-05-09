'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Script from 'next/script';
import { TrendingUp, ExternalLink, RefreshCw } from 'lucide-react';

/**
 * GoogleTrendsWidget — Embeds Google Trends "Football" trending graph
 * using the official Google Trends embed_loader.js script.
 *
 * Renders a TIMESERIES chart + RELATED_QUERIES inside a glassmorphism container.
 */
export default function GoogleTrendsWidget() {
  const timeseriesRef = useRef<HTMLDivElement>(null);
  const queriesRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const FOOTBALL_KEYWORD = 'football';
  const TIME_RANGE = 'today 12-m';
  const GEO = ''; // worldwide
  const EXPLORE_QUERY = `q=${FOOTBALL_KEYWORD}&date=${TIME_RANGE}`;
  const GUEST_PATH = `https://trends.google.com:443/trends/explore?q=${FOOTBALL_KEYWORD}&date=${encodeURIComponent(TIME_RANGE)}`;

  const comparisonItem = [
    { keyword: FOOTBALL_KEYWORD, geo: GEO, time: TIME_RANGE },
  ];

  const embedOptions = JSON.stringify({
    comparisonItem,
    category: 0,
    property: '',
  });

  const renderOptions = JSON.stringify({
    exploreQuery: EXPLORE_QUERY,
    guestPath: GUEST_PATH,
  });

  useEffect(() => {
    if (!scriptLoaded) return;

    const renderWidget = (
      container: HTMLDivElement | null,
      type: string,
    ) => {
      if (!container) return false;

      // Clear previous content
      container.innerHTML = '';

      try {
        // The Google Trends embed function inserts an iframe after the calling script element.
        // By creating a script element inside our container, the iframe will also be placed there.
        const scriptEl = document.createElement('script');
        scriptEl.type = 'text/javascript';
        scriptEl.innerHTML = `trends.embed.renderExploreWidget("${type}",${embedOptions},${renderOptions});`;
        container.appendChild(scriptEl);
        return true;
      } catch {
        return false;
      }
    };

    // Small delay to ensure the trends global is available
    const timer = setTimeout(() => {
      const t1 = renderWidget(timeseriesRef.current, 'TIMESERIES');
      const t2 = renderWidget(queriesRef.current, 'RELATED_QUERIES');
      if (!t1 && !t2) setError(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [scriptLoaded, refreshKey, embedOptions, renderOptions]);

  const handleRefresh = () => {
    setError(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      {/* Load Google Trends embed script */}
      <Script
        src="https://ssl.gstatic.com/trends_nrtr/33_RC01/embed_loader.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setError(true)}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="glass-card p-4 sm:p-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Google <span className="neon-text">Trends</span>
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
              LIVE
            </span>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Refresh trends"
            >
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Tren pencarian &quot;Football&quot; dalam 12 bulan terakhir
        </p>

        {/* Timeseries Chart Container */}
        <div className="rounded-xl overflow-hidden bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] mb-3">
          {!scriptLoaded && !error && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Memuat grafik tren...
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
              <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
              <p>Gagal memuat Google Trends</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-xs text-sky-500 hover:text-sky-400 dark:text-neon/70 dark:hover:text-neon transition-colors"
              >
                Coba lagi
              </button>
            </div>
          )}
          <div
            ref={timeseriesRef}
            className="[&_iframe]:w-full [&_iframe]:min-h-[300px] [&_iframe]:border-0"
          />
        </div>

        {/* Related Queries Container */}
        <div className="rounded-xl overflow-hidden bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
          <div
            ref={queriesRef}
            className="[&_iframe]:w-full [&_iframe]:min-h-[280px] [&_iframe]:border-0"
          />
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Data dari Google Trends
          </span>
          <a
            href={`https://trends.google.com/trends/explore?q=${FOOTBALL_KEYWORD}&date=${encodeURIComponent(TIME_RANGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-neon/70 hover:text-neon flex items-center gap-1 transition-colors"
          >
            Lihat di Google Trends
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </motion.div>
    </>
  );
}
