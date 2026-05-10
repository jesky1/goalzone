'use client';

import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: 'loading' | 'error' | 'api-key' | 'empty';
  onRetry?: () => void;
  retrying?: boolean;
}

/**
 * Komponen EmptyState untuk menampilkan pesan ketika data kosong,
 * API limit habis, atau API key belum dikonfigurasi.
 * Menggantikan tampilan blank/putih yang terjadi saat error.
 */
export default function EmptyState({
  title,
  message,
  icon = 'loading',
  onRetry,
  retrying,
}: EmptyStateProps) {
  const config = {
    loading: {
      iconEl: <div className="w-10 h-10 rounded-full border-2 border-muted-foreground/20 border-t-neon animate-spin" />,
      defaultTitle: 'Memuat data...',
      defaultMessage: 'Sedang mengambil data dari server',
    },
    empty: {
      iconEl: <AlertCircle className="w-10 h-10 text-muted-foreground/40" />,
      defaultTitle: 'Data sedang diperbarui',
      defaultMessage: 'Belum ada data tersedia saat ini. Coba lagi nanti.',
    },
    error: {
      iconEl: <AlertCircle className="w-10 h-10 text-amber-400/60" />,
      defaultTitle: 'Data sedang diperbarui',
      defaultMessage: 'Terjadi kesalahan saat mengambil data. Coba lagi nanti.',
    },
    'api-key': {
      iconEl: <WifiOff className="w-10 h-10 text-amber-400/60" />,
      defaultTitle: 'API Key Belum Dikonfigurasi',
      defaultMessage: 'Tambahkan FOOTBALL_API_KEY di .env atau Vercel Environment Variables untuk menampilkan data asli.',
    },
  };

  const { iconEl, defaultTitle, defaultMessage } = config[icon];

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="mb-3 opacity-60">{iconEl}</div>
      <h4 className="text-sm font-semibold text-foreground/80 mb-1">
        {title || defaultTitle}
      </h4>
      <p className="text-xs text-muted-foreground max-w-xs">
        {message || defaultMessage}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neon/10 text-neon border border-neon/20 hover:bg-neon/20 transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
          Coba Lagi
        </button>
      )}
    </div>
  );
}
