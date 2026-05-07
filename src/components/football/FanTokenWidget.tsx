'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Coins, RefreshCw, ExternalLink } from 'lucide-react';

interface FanToken {
  symbol: string;
  name: string;
  team: string;
  league: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  logo: string;
  color: string;
  image: string;
  sparkline: number[];
}

interface FanTokenSummary {
  totalMarketCap: number;
  totalTokens: number;
  gainers: number;
  losers: number;
  topGainer: {
    symbol: string;
    team: string;
    changePercent24h: number;
  };
}

function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(4)}`;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toLocaleString()}`;
}

function RealSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const color = positive ? '#22c55e' : '#ef4444';
  const gradientId = `spark-${Math.random().toString(36).slice(2, 8)}`;

  const normalized = useMemo(() => {
    if (!data || data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data.map((v) => ((v - min) / range) * 80 + 10);
  }, [data]);

  if (normalized.length === 0) {
    return <div className="w-full h-8" />;
  }

  const pathD = normalized
    .map((y, i) => {
      const x = (i / (normalized.length - 1)) * 80 + 10;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-full h-8 opacity-80" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L 90 100 L 10 100 Z`}
        fill={`url(#${gradientId})`}
      />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FanTokenWidget() {
  const [tokens, setTokens] = useState<FanToken[]>([]);
  const [summary, setSummary] = useState<FanTokenSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<string>('loading');

  const loadTokens = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch('/api/fan-tokens');
      if (res.ok) {
        const data = await res.json();
        const list = data.tokens || [];
        if (Array.isArray(list)) {
          setTokens(list);
          setSummary(data.summary || null);
          setLastUpdated(new Date());
          setDataSource(data.source || 'unknown');
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTokens();
    const interval = setInterval(loadTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  const displayedTokens = tokens.slice(0, 6);

  return (
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
          <Coins className="w-5 h-5 text-neon" />
          <h3 className="text-lg font-bold text-white">
            Fan <span className="neon-text">Tokens</span>
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
            dataSource === 'coingecko' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
            dataSource === 'mock' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-gray-500/10 text-gray-400'
          }`}>
            {dataSource === 'coingecko' ? 'LIVE' : dataSource === 'mock' ? 'OFFLINE' : '...'}
          </span>
          <button
            onClick={loadTokens}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-40"
            aria-label="Refresh token prices"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Harga Fan Token klub bola {dataSource === 'coingecko' ? 'real-time via CoinGecko' : 'dari data lokal'}
      </p>

      {/* Summary Bar */}
      {summary && !loading && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-green-400 font-medium">{summary.gainers}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span className="text-red-400 font-medium">{summary.losers}</span>
          </div>
          <div className="ml-auto text-[10px] text-muted-foreground">
            MCAP {formatNumber(summary.totalMarketCap)}
          </div>
        </div>
      )}

      {/* Token List */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-1">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
                  <div className="h-2 w-12 bg-white/5 rounded animate-pulse" />
                </div>
                <div className="text-right space-y-1.5">
                  <div className="h-3 w-12 bg-white/5 rounded animate-pulse ml-auto" />
                  <div className="h-2 w-10 bg-white/5 rounded animate-pulse ml-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && displayedTokens.map((token, index) => {
          const isPositive = token.changePercent24h >= 0;

          return (
            <motion.div
              key={token.symbol}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all duration-200 group cursor-pointer"
            >
              {/* Token Icon - Show real image if available */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 border border-white/10 overflow-hidden"
                style={{ backgroundColor: `${token.color}20` }}
              >
                {token.image ? (
                  <img src={token.image} alt={token.symbol} className="w-full h-full object-cover" />
                ) : (
                  token.logo
                )}
              </div>

              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white">
                    ${token.symbol}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {token.league}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {token.team}
                </div>
              </div>

              {/* Real Sparkline from CoinGecko */}
              <div className="w-14 h-7 shrink-0 hidden sm:block">
                {token.sparkline && token.sparkline.length > 0 ? (
                  <RealSparkline data={token.sparkline} positive={isPositive} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600">—</div>
                )}
              </div>

              {/* Price & Change */}
              <div className="text-right shrink-0">
                {token.price > 0 ? (
                  <>
                    <div className="text-sm font-bold text-white tabular-nums">
                      {formatPrice(token.price)}
                    </div>
                    <div
                      className={`text-[11px] font-semibold tabular-nums flex items-center justify-end gap-0.5 ${
                        isPositive ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isPositive ? '+' : ''}
                      {token.changePercent24h.toFixed(2)}%
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-gray-600">N/A</div>
                )}
              </div>
            </motion.div>
          );
        })}

        {!loading && tokens.length === 0 && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Memuat data Fan Token...
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && tokens.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="text-[10px] text-muted-foreground">
            {lastUpdated &&
              `Update: ${lastUpdated.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}`}
          </div>
          <a
            href="https://www.socios.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-neon/70 hover:text-neon flex items-center gap-1 transition-colors"
          >
            Powered by Socios.com
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      )}

      {/* Top Gainer Banner */}
      {!loading && summary && summary.topGainer && summary.topGainer.changePercent24h !== 0 && (
        <div className="mt-3 p-2.5 rounded-lg bg-green-500/5 border border-green-500/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-green-400">Top Gainer</span>
            <span className="text-xs text-white font-semibold">
              ${summary.topGainer.symbol}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {summary.topGainer.team}
            </span>
            <span className="ml-auto text-xs font-bold text-green-400 tabular-nums">
              +{summary.topGainer.changePercent24h.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
