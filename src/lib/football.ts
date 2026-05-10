/**
 * GOALZONE — Global Football API Fetcher
 *
 * Menggunakan API-Sports (https://v3.football.api-sports.io)
 * dengan header x-apisports-key untuk autentikasi.
 *
 * Juga mendukung RapidAPI endpoint secara otomatis
 * jika FOOTBALL_API_BASE diatur ke rapidapi.com.
 *
 * Environment Variables:
 * - FOOTBALL_API_KEY  (wajib) API key dari api-sports.io atau RapidAPI
 * - FOOTBALL_API_BASE (opsional) Default: https://v3.football.api-sports.io
 */

const API_KEY = process.env.FOOTBALL_API_KEY || '';
const API_BASE = process.env.FOOTBALL_API_BASE || 'https://v3.football.api-sports.io';

/** True jika menggunakan RapidAPI endpoint */
export const isRapidAPI = API_BASE.includes('rapidapi.com');

/** True jika API key sudah dikonfigurasi */
export const isFootballApiConfigured = API_KEY !== '';

/** Base URL Football API */
export const footballApiBase = API_BASE;

// ─── Response Type ─────────────────────────────────────────────
export interface FootballApiResponse<T = any> {
  response: T;
  errors: Record<string, string>;
  results: number;
  paging: {
    current: number;
    total: number;
  };
}

// ─── Headers ───────────────────────────────────────────────────
/** Headers untuk autentikasi ke Football API */
export function footballApiHeaders(): Record<string, string> {
  if (isRapidAPI) {
    return {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
    };
  }
  // Direct API-Sports
  return {
    'x-apisports-key': API_KEY,
  };
}

// ─── Raw Fetch (returns Response) ──────────────────────────────
/** Fetch dari Football API dengan autentikasi yang benar */
export async function footballFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...footballApiHeaders(),
    },
  });
}

// ─── JSON Fetch (returns parsed JSON) ──────────────────────────
/** Fetch dari Football API dan langsung parse JSON response */
export async function footballFetchJson<T = any>(path: string, init?: RequestInit): Promise<FootballApiResponse<T>> {
  const res = await footballFetch(path, init);
  if (!res.ok) {
    throw new Error(`Football API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    const errorMsg = Object.values(data.errors).join(', ');
    throw new Error(`Football API returned errors: ${errorMsg}`);
  }
  return data;
}

// ─── Convenience: Get Squad ────────────────────────────────────
/** Ambil squad pemain untuk tim tertentu */
export async function getSquad(teamId: number) {
  const data = await footballFetchJson<any[]>(`/players/squads?team=${teamId}`, {
    next: { revalidate: 3600 }, // Cache 1 jam
  });
  return data.response?.[0]?.players || [];
}

// ─── Convenience: Get Fixtures ─────────────────────────────────
/** Ambil fixtures/pertandingan dengan parameter fleksibel */
export async function getFixtures(params: {
  team?: number;
  league?: number;
  season?: number;
  date?: string;
  last?: number;
  next?: number;
  from?: string;
  to?: string;
  timezone?: string;
}) {
  const query = new URLSearchParams();
  if (params.team) query.set('team', String(params.team));
  if (params.league) query.set('league', String(params.league));
  if (params.season) query.set('season', String(params.season));
  if (params.date) query.set('date', params.date);
  if (params.last) query.set('last', String(params.last));
  if (params.next) query.set('next', String(params.next));
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.timezone) query.set('timezone', params.timezone);
  else query.set('timezone', 'Asia/Jakarta');

  const data = await footballFetchJson<any[]>(`/fixtures?${query.toString()}`, {
    next: { revalidate: 60 }, // Cache 1 menit untuk data live
  });
  return data.response || [];
}

// ─── Convenience: Get Team Info ────────────────────────────────
/** Ambil info tim berdasarkan ID */
export async function getTeamInfo(teamId: number) {
  const data = await footballFetchJson<any[]>(`/teams?id=${teamId}`, {
    next: { revalidate: 3600 },
  });
  return data.response?.[0] || null;
}

// ─── Convenience: Get Standings ────────────────────────────────
/** Ambil klasemen liga */
export async function getStandings(leagueId: number, season: number) {
  const data = await footballFetchJson<any[]>(`/standings?league=${leagueId}&season=${season}`, {
    next: { revalidate: 1800 },
  });
  return data.response?.[0]?.league || null;
}
