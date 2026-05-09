/**
 * Football API configuration — auto-detects RapidAPI vs direct API-Football
 * based on FOOTBALL_API_BASE env variable.
 *
 * RapidAPI:  FOOTBALL_API_BASE=https://api-football-v1.p.rapidapi.com/v3
 *            Header: x-rapidapi-key
 *
 * Direct:    FOOTBALL_API_BASE=https://v3.football.api-sports.io
 *            Header: x-apisports-key
 */

const API_KEY = process.env.FOOTBALL_API_KEY || '';
const API_BASE = process.env.FOOTBALL_API_BASE || 'https://v3.football.api-sports.io';

/** True if using RapidAPI endpoint */
export const isRapidAPI = API_BASE.includes('rapidapi.com');

/** True if a Football API key is configured */
export const isFootballApiConfigured = API_KEY !== '';

/** Base URL for Football API (e.g., https://api-football-v1.p.rapidapi.com/v3) */
export const footballApiBase = API_BASE;

/** Headers to authenticate with the Football API */
export function footballApiHeaders(): Record<string, string> {
  if (isRapidAPI) {
    return {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
    };
  }
  return {
    'x-apisports-key': API_KEY,
  };
}

/** Convenience: fetch from Football API with correct auth headers */
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
