'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, RefreshCw, ExternalLink } from 'lucide-react';

interface TransferTeam {
  name: string;
  logo: string;
}

interface TransferEntry {
  id: string;
  playerName: string;
  playerPhoto: string;
  position: string;
  from: TransferTeam;
  to: TransferTeam;
  date: string;
  type: string;
  amount: string;
  season: number;
}

export default function TransferFeed() {
  const [transfers, setTransfers] = useState<TransferEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState<string>('loading');
  const [showAll, setShowAll] = useState(false);

  const loadTransfers = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch('/api/transfers');
      if (res.ok) {
        const data = await res.json();
        const list = data.transfers || [];
        if (Array.isArray(list)) {
          setTransfers(list);
          setSource(data.source || 'unknown');
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
    loadTransfers();
  }, []);

  const displayTransfers = showAll ? transfers : transfers.slice(0, 8);

  function formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  function getPositionColor(pos: string): string {
    const lower = pos.toLowerCase();
    if (lower.includes('gk') || lower.includes('keeper')) return 'bg-amber-500/15 text-amber-400';
    if (lower.includes('def') || lower.includes('back')) return 'bg-blue-500/15 text-blue-400';
    if (lower.includes('mid') || lower.includes('midfielder')) return 'bg-green-500/15 text-green-400';
    if (lower.includes('att') || lower.includes('forward') || lower.includes('striker') || lower.includes('winger')) return 'bg-red-500/15 text-red-400';
    return 'bg-white/5 text-gray-400';
  }

  function getPositionShort(pos: string): string {
    const lower = pos.toLowerCase();
    if (lower.includes('gk') || lower.includes('keeper')) return 'GK';
    if (lower.includes('def') || lower.includes('back')) return 'DEF';
    if (lower.includes('mid') || lower.includes('midfielder')) return 'MID';
    if (lower.includes('att') || lower.includes('forward') || lower.includes('striker') || lower.includes('winger')) return 'FWD';
    return pos.slice(0, 3).toUpperCase();
  }

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
          <ArrowRightLeft className="w-5 h-5 text-neon" />
          <h3 className="text-lg font-bold text-white">
            Transfer <span className="neon-text">Terbaru</span>
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
            source === 'api-football' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
            source === 'mock' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-gray-500/10 text-gray-400'
          }`}>
            {source === 'api-football' ? 'LIVE' : source === 'mock' ? 'CURATED' : '...'}
          </span>
          <button
            onClick={loadTransfers}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-40"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Transfer window musim 2025/2026
      </p>

      {/* Transfer List */}
      <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-1.5">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                  <div className="h-2 w-40 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && displayTransfers.map((transfer, index) => (
          <motion.div
            key={transfer.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
          >
            {/* Player Photo */}
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-white/5 border border-white/10">
              {transfer.playerPhoto ? (
                <img src={transfer.playerPhoto} alt={transfer.playerName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-600">
                  {transfer.playerName.charAt(0)}
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white truncate group-hover:text-neon transition-colors">
                  {transfer.playerName}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${getPositionColor(transfer.position)}`}>
                  {getPositionShort(transfer.position)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                {/* From team */}
                <div className="flex items-center gap-1 min-w-0">
                  {transfer.from.logo && (
                    <img src={transfer.from.logo} alt="" className="w-3 h-3 rounded-full object-contain shrink-0" />
                  )}
                  <span className="truncate">{transfer.from.name}</span>
                </div>
                {/* Arrow */}
                <ArrowRightLeft className="w-3 h-3 text-neon/60 shrink-0 rotate-90 sm:rotate-0" />
                {/* To team */}
                <div className="flex items-center gap-1 min-w-0">
                  {transfer.to.logo && (
                    <img src={transfer.to.logo} alt="" className="w-3 h-3 rounded-full object-contain shrink-0" />
                  )}
                  <span className="truncate font-medium text-white/80">{transfer.to.name}</span>
                </div>
              </div>
            </div>

            {/* Amount + Date */}
            <div className="text-right shrink-0">
              {transfer.amount && transfer.amount !== '$0' && transfer.amount !== 'Free' ? (
                <div className="text-sm font-bold text-neon tabular-nums">{transfer.amount}</div>
              ) : (
                <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                  transfer.type.toLowerCase().includes('loan') ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'
                }`}>
                  {transfer.type.includes('Loan') ? 'LOAN' : 'FREE'}
                </div>
              )}
              <div className="text-[10px] text-gray-600 mt-0.5">{formatDate(transfer.date)}</div>
            </div>
          </motion.div>
        ))}

        {!loading && transfers.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Memuat data transfer...
          </div>
        )}
      </div>

      {/* Show More / Footer */}
      {!loading && transfers.length > 8 && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {transfers.length} transfer terbaru
          </span>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[11px] text-neon/70 hover:text-neon flex items-center gap-1 transition-colors"
          >
            {showAll ? 'Tampilkan Sedikit' : `Lihat Semua (${transfers.length})`}
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
