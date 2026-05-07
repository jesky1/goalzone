'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Trophy,
  RefreshCw,
  Search,
  Calendar,
  MapPin,
  Swords,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';

// ─── Types ──────────────────────────────────────────────────

interface MatchResult {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  league: string | null;
  season: number | null;
  venue: string | null;
  matchWeek: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MatchFormData {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  league: string;
  season: string;
  venue: string;
  matchWeek: string;
  status: string;
  notes: string;
}

const emptyForm: MatchFormData = {
  homeTeam: '',
  awayTeam: '',
  homeScore: 0,
  awayScore: 0,
  matchDate: new Date().toISOString().split('T')[0],
  league: '',
  season: '',
  venue: '',
  matchWeek: '',
  status: 'finished',
  notes: '',
};

// ─── Helpers ────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getResultBadge(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) {
    return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px]">Menang</Badge>;
  }
  if (homeScore < awayScore) {
    return <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px]">Kalah</Badge>;
  }
  return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[10px]">Seri</Badge>;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'scheduled': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'finished': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'postponed': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'abandoned': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

// ─── Main Page ──────────────────────────────────────────────

export default function AdminMatchesPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [totalMatches, setTotalMatches] = useState(0);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [formData, setFormData] = useState<MatchFormData>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Redirect if not authenticated ─────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // ─── Fetch matches ────────────────────────────────────────
  const fetchMatches = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/data/matches?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal memuat data');
        setMatches([]);
        return;
      }

      setMatches(json.data.matches);
      setTotalMatches(json.data.total);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, statusFilter]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchMatches();
    }
  }, [isAuthenticated, token, fetchMatches]);

  // ─── Handlers ─────────────────────────────────────────────
  const openAddDialog = () => {
    setFormData({ ...emptyForm, matchDate: new Date().toISOString().split('T')[0] });
    setFormError(null);
    setShowAddDialog(true);
  };

  const openEditDialog = (match: MatchResult) => {
    setSelectedMatch(match);
    setFormData({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      matchDate: match.matchDate,
      league: match.league || '',
      season: match.season?.toString() || '',
      venue: match.venue || '',
      matchWeek: match.matchWeek?.toString() || '',
      status: match.status,
      notes: match.notes || '',
    });
    setFormError(null);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (match: MatchResult) => {
    setSelectedMatch(match);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    if (!token) return;
    setFormLoading(true);
    setFormError(null);

    try {
      const url = isEdit
        ? `/api/admin/data/matches/${selectedMatch?.id}`
        : '/api/admin/data/matches';

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setFormError(json.error || (isEdit ? 'Gagal mengupdate' : 'Gagal menambah'));
        return;
      }

      setShowAddDialog(false);
      setShowEditDialog(false);
      setSelectedMatch(null);
      fetchMatches();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !selectedMatch) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/data/matches/${selectedMatch.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal menghapus');
        return;
      }

      setShowDeleteDialog(false);
      setSelectedMatch(null);
      fetchMatches();
    } catch {
      setError('Gagal menghapus');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Filter matches ───────────────────────────────────────
  const filteredMatches = matches; // search & status filter are server-side

  const statusTabs = [
    { value: '', label: 'Semua' },
    { value: 'scheduled', label: 'Mendatang' },
    { value: 'finished', label: 'Selesai' },
    { value: 'postponed', label: 'Ditunda' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ];

  // ─── Auth states ──────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {/* ─── Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0a0a12]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin')}
                className="text-muted-foreground hover:text-white -ml-1"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline text-xs">Dashboard</span>
              </Button>
              <div className="h-5 w-px bg-white/10" />
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    Hasil Pertandingan
                  </h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {totalMatches} pertandingan
                  </p>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMatches}
                disabled={loading}
                className="text-muted-foreground hover:text-emerald-400"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={openAddDialog}
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Tambah Hasil</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Content ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari tim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/[0.03] border-white/10 text-sm h-9 sm:h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            const tabColor = !tab.value ? 'bg-neon/10 text-neon border-neon/20' :
              tab.value === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              tab.value === 'finished' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              tab.value === 'postponed' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-red-500/10 text-red-400 border-red-500/20';

            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 border
                  ${isActive
                    ? tabColor
                    : 'text-muted-foreground hover:text-white bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-3">
            {/* Desktop skeleton */}
            <div className="hidden md:block rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <Skeleton className="h-4 w-40" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex-1" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
            {/* Mobile skeleton */}
            <div className="md:hidden space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredMatches.length === 0 ? (
          /* ─── Empty State ──────────────────────────────── */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 sm:py-24"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-4">
              <Swords className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
              {searchQuery || statusFilter ? 'Tidak ada hasil' : 'Belum ada pertandingan'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery || statusFilter
                ? `Tidak ditemukan pertandingan${statusFilter ? ` dengan status "${statusTabs.find(t => t.value === statusFilter)?.label}"` : ''}${searchQuery ? ` untuk "${searchQuery}"` : ''}`
                : 'Mulai tambahkan hasil pertandingan'}
            </p>
            {!searchQuery && (
              <Button
                onClick={openAddDialog}
                className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Hasil Pertandingan
              </Button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="matches-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* ─── Desktop Table ────────────────────────── */}
              <Card className="hidden md:block border-white/5 bg-white/[0.02] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Pertandingan</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-center w-[120px]">Skor</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Tanggal</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Liga</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/5">
                    {filteredMatches.map((match, idx) => (
                      <TableRow key={match.id} className="border-white/5 hover:bg-white/[0.02] group">
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs text-muted-foreground/50 font-mono w-5 shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {match.homeTeam}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {match.awayTeam}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                              <span className="text-lg font-bold text-white tabular-nums min-w-[1.5rem] text-center">
                                {match.homeScore}
                              </span>
                              <span className="text-xs text-muted-foreground">-</span>
                              <span className="text-lg font-bold text-white tabular-nums min-w-[1.5rem] text-center">
                                {match.awayScore}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {formatDate(match.matchDate)}
                          </div>
                          {match.venue && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[150px]">{match.venue}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {match.league ? (
                            <span className="text-xs text-muted-foreground">{match.league}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${getStatusColor(match.status)} text-[10px]`}>
                            {match.status === 'scheduled' ? 'Mendatang' :
                             match.status === 'finished' ? 'Selesai' :
                             match.status === 'postponed' ? 'Ditunda' :
                             match.status === 'cancelled' ? 'Dibatalkan' :
                             match.status === 'abandoned' ? 'Dihentikan' : match.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(match)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-400"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(match)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* ─── Mobile Cards ─────────────────────────── */}
              <div className="md:hidden space-y-3">
                {filteredMatches.map((match, idx) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className="border-white/5 bg-white/[0.02] overflow-hidden">
                      <CardContent className="p-4">
                        {/* League header */}
                        {match.league && (
                          <div className="mb-3">
                            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                              {match.league}
                              {match.matchWeek ? ` · Minggu ${match.matchWeek}` : ''}
                            </span>
                          </div>
                        )}

                        {/* Match row */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          {/* Home */}
                          <div className="flex-1 min-w-0 text-right">
                            <p className="text-sm font-semibold text-white truncate">
                              {match.homeTeam}
                            </p>
                          </div>

                          {/* Score */}
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/5 shrink-0">
                            <span className="text-lg font-bold text-white tabular-nums">
                              {match.homeScore}
                            </span>
                            <span className="text-xs text-muted-foreground/50">-</span>
                            <span className="text-lg font-bold text-white tabular-nums">
                              {match.awayScore}
                            </span>
                          </div>

                          {/* Away */}
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-white truncate">
                              {match.awayTeam}
                            </p>
                          </div>
                        </div>

                        {/* Footer row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                              <Calendar className="w-3 h-3" />
                              {formatDate(match.matchDate)}
                            </div>
                            {match.venue && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground/40">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{match.venue}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(match)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-400"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(match)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* ─── Count ─────────────────────────────────── */}
              <p className="text-xs text-muted-foreground/50 text-center mt-4 sm:mt-6">
                {totalMatches} pertandingan
                {statusFilter && ` · ${statusTabs.find(t => t.value === statusFilter)?.label}`}
                {searchQuery && ` cocok dengan "${searchQuery}"`}
              </p>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ─── Add / Edit Dialog ────────────────────────────── */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          setSelectedMatch(null);
          setFormError(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg bg-[#12121a] border-white/10 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              {showEditDialog ? 'Edit Hasil Pertandingan' : 'Tambah Hasil Pertandingan'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {showEditDialog
                ? 'Update skor dan detail pertandingan'
                : 'Masukkan skor pertandingan yang ingin ditambahkan'}
            </DialogDescription>
          </DialogHeader>

          {/* Form Error */}
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{formError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4 py-2">
            {/* Score Row */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Skor Pertandingan
              </Label>
              <div className="grid grid-cols-5 gap-2 sm:gap-3 items-center">
                <div className="col-span-2">
                  <Input
                    placeholder="Tim Kandang"
                    value={formData.homeTeam}
                    onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                    className="bg-white/[0.03] border-white/10 text-sm h-10 sm:h-11"
                  />
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    value={formData.homeScore}
                    onChange={(e) => setFormData({ ...formData, homeScore: parseInt(e.target.value) || 0 })}
                    className="bg-white/[0.03] border-white/10 text-center text-lg font-bold tabular-nums h-10 sm:h-11 w-12 sm:w-14"
                  />
                  <span className="text-lg font-bold text-muted-foreground">-</span>
                  <Input
                    type="number"
                    min="0"
                    value={formData.awayScore}
                    onChange={(e) => setFormData({ ...formData, awayScore: parseInt(e.target.value) || 0 })}
                    className="bg-white/[0.03] border-white/10 text-center text-lg font-bold tabular-nums h-10 sm:h-11 w-12 sm:w-14"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    placeholder="Tim Tandang"
                    value={formData.awayTeam}
                    onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                    className="bg-white/[0.03] border-white/10 text-sm h-10 sm:h-11"
                  />
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Tanggal Pertandingan *
                </Label>
                <Input
                  type="date"
                  value={formData.matchDate}
                  onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                  className="bg-white/[0.03] border-white/10 text-sm h-10 sm:h-11"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="bg-white/[0.03] border-white/10 text-sm h-10 sm:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="scheduled">Mendatang (Jadwal)</SelectItem>
                    <SelectItem value="finished">Selesai</SelectItem>
                    <SelectItem value="postponed">Ditunda</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    <SelectItem value="abandoned">Dihentikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* League & Season */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Liga / Kompetisi
                </Label>
                <Input
                  placeholder="Contoh: Premier League"
                  value={formData.league}
                  onChange={(e) => setFormData({ ...formData, league: e.target.value })}
                  className="bg-white/[0.03] border-white/10 text-sm h-10 sm:h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Musim
                  </Label>
                  <Input
                    placeholder="2024/25"
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="bg-white/[0.03] border-white/10 text-sm h-10 sm:h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Minggu ke-
                  </Label>
                  <Input
                    type="number"
                    placeholder="12"
                    value={formData.matchWeek}
                    onChange={(e) => setFormData({ ...formData, matchWeek: e.target.value })}
                    className="bg-white/[0.03] border-white/10 text-sm h-10 sm:h-11"
                  />
                </div>
              </div>
            </div>

            {/* Venue */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Stadion / Venue
              </Label>
              <Input
                placeholder="Contoh: Old Trafford"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="bg-white/[0.03] border-white/10 text-sm h-10 sm:h-11"
              />
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Catatan (opsional)
              </Label>
              <Input
                placeholder="Catatan tambahan..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white/[0.03] border-white/10 text-sm h-10 sm:h-11"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddDialog(false);
                setShowEditDialog(false);
                setSelectedMatch(null);
                setFormError(null);
              }}
              className="text-muted-foreground hover:text-white"
            >
              Batal
            </Button>
            <Button
              onClick={() => handleSubmit(!!showEditDialog)}
              disabled={formLoading || !formData.homeTeam || !formData.awayTeam || !formData.matchDate}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
            >
              {formLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : showEditDialog ? (
                <>
                  <Pencil className="w-4 h-4" />
                  Update
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Tambah
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteDialog(false);
          setSelectedMatch(null);
        }
      }}>
        <AlertDialogContent className="bg-[#12121a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Hapus Pertandingan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Apakah Anda yakin ingin menghapus pertandingan
              <span className="text-white font-medium">
                {' '}{selectedMatch?.homeTeam} vs {selectedMatch?.awayTeam}{' '}
              </span>
              ({selectedMatch?.homeScore} - {selectedMatch?.awayScore})?
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white/[0.03] border-white/10 text-muted-foreground hover:text-white hover:bg-white/[0.05]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-500 hover:bg-red-600 text-white gap-2"
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
