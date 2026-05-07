'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ExternalLink } from 'lucide-react';

/* ─────────────────────────────────────────────
   GoogleTrendsWidget
   Embeds the Google Trends explore widget
   ("Interest over time" chart) for a given
   keyword inside a Glassmorphism card.
   ───────────────────────────────────────────── */

interface GoogleTrendsWidgetProps {
  /** Keyword to track — defaults to "Football" */
  keyword?: string;
  /** Geo restrict  e.g. "US" "ID" "" (worldwide) */
  geo?: string;
  /** Time range — "today 12-m" | "today 3-m" | "today 1-m" etc. */
  timeRange?: string;
  /** Explore widget type */
  widgetType?: 'TIMESERIES' | 'GEO_MAP' | 'RELATED_QUERIES';
  /** Optional extra class names on the outer wrapper */
  className?: string;
}

declare global {
  interface Window {
    trends?: {
      embed: {
        renderExploreWidget: (
          type: string,
          options: Record<string, unknown>,
          renderOptions: Record<string, string>,
        ) => void;
      };
    };
  }
}

export default function GoogleTrendsWidget({
  keyword = 'Football',
  geo = '',
  timeRange = 'today 12-m',
  widgetType = 'TIMESERIES',
  className = '',
}: GoogleTrendsWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    /* Skip on server & when container is gone */
    if (!containerRef.current) return;

    /* Google Trends loader URL */
    const scriptSrc =
      'https://ssl.gstatic.com/trends_nrtr/3869_RC01/js/loader.js';

    /* Render helper — called after script is available */
    const renderWidget = () => {
      if (!window.trends || !containerRef.current) {
        setError(true);
        return;
      }
      try {
        window.trends.embed.renderExploreWidget(
          widgetType,
          {
            comparisonItem: [{ keyword, geo, time: timeRange }],
            category: 0,
            property: '',
          },
          {
            exploreQuery: `q=${encodeURIComponent(keyword)}`,
            guestPath: 'https://trends.google.com:443/trends/embed/',
          },
        );
        setLoaded(true);
      } catch {
        setError(true);
      }
    };

    /* If the loader is already present, render immediately */
    if (window.trends) {
      renderWidget();
      return;
    }

    /* Otherwise load the script, then render */
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.onload = renderWidget;
    script.onerror = () => setError(true);
    document.head.appendChild(script);

    return () => {
      /* Clean up the rendered iframe if component unmounts */
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [keyword, geo, timeRange, widgetType]);

  /* ─── Widget type label ─────────────────── */
  const widgetLabel: Record<string, string> = {
    TIMESERIES: 'Interest Over Time',
    GEO_MAP: 'Interest by Region',
    RELATED_QUERIES: 'Related Queries',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`glass-card ${className}`}
    >
      {/* ─── Header ────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Google Trends
            </h3>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">
              {widgetLabel[widgetType]} &middot; &ldquo;{keyword}&rdquo;
            </p>
          </div>
        </div>

        <a
          href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}&geo=${geo}&date=${timeRange}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-cyan-400 transition-colors duration-200"
          aria-label={`View ${keyword} on Google Trends`}
        >
          <ExternalLink className="w-3 h-3" />
          <span className="hidden sm:inline">Open in Google Trends</span>
        </a>
      </div>

      {/* ─── Accent divider ────────────────── */}
      <div className="mx-4 sm:mx-5 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* ─── Widget body ───────────────────── */}
      <div className="p-3 sm:p-5">
        {/* Loading skeleton */}
        {!loaded && !error && (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 w-1/3 rounded bg-white/5" />
            <div className="relative h-48 sm:h-64 rounded-xl bg-white/[0.03] border border-white/[0.04] overflow-hidden">
              {/* Fake chart lines */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke="rgba(0,240,255,0.15)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="0,160 40,140 80,120 120,130 160,90 200,100 240,60 280,70 320,40 360,50 400,30"
                />
              </svg>
            </div>
            <div className="flex gap-2">
              <div className="h-2 w-16 rounded bg-white/5" />
              <div className="h-2 w-12 rounded bg-white/5" />
              <div className="h-2 w-20 rounded bg-white/5" />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center h-48 sm:h-64 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center px-6">
            <TrendingUp className="w-8 h-8 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground/50">
              Unable to load Google Trends widget
            </p>
            <a
              href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors"
            >
              View on Google Trends &rarr;
            </a>
          </div>
        )}

        {/* Google Trends container — the script renders an iframe here */}
        <div
          ref={containerRef}
          className={`w-full rounded-xl overflow-hidden ${
            loaded ? '' : 'hidden'
          }`}
        />

        {/* Caption */}
        {loaded && (
          <p className="mt-3 text-[10px] text-muted-foreground/30 text-center">
            Data provided by{' '}
            <a
              href="https://trends.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors duration-200"
            >
              Google Trends
            </a>
          </p>
        )}
      </div>
    </motion.div>
  );
}
