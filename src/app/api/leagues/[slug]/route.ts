import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export const revalidate = 300;

// ─── Types ──────────────────────────────────────────────────

interface StandingTeam {
  rank: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

interface LeagueMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  venue: string | null;
  matchWeek: number | null;
  status: string;
  homeTeamLogoUrl: string | null;
  awayTeamLogoUrl: string | null;
}

interface TopScorer {
  rank: number;
  name: string;
  team: string;
  teamSlug: string;
  goals: number;
  assists: number;
  teamLogoUrl: string | null;
}

interface LeagueProfile {
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string;
  season: number;
  founded: number | null;
  teams: number;
  matchesPlayed: number;
  totalGoals: number;
  primaryColor: string;
  secondaryColor: string;
  standings: StandingTeam[];
  recentMatches: LeagueMatch[];
  topScorers: TopScorer[];
}

// ─── Team Logos ─────────────────────────────────────────────

const TEAM_LOGOS: Record<string, string> = {
  'Manchester City': 'https://media.api-sports.io/football/teams/50.png',
  'Arsenal': 'https://media.api-sports.io/football/teams/42.png',
  'Liverpool': 'https://media.api-sports.io/football/teams/40.png',
  'Chelsea': 'https://media.api-sports.io/football/teams/49.png',
  'Tottenham': 'https://media.api-sports.io/football/teams/47.png',
  'Aston Villa': 'https://media.api-sports.io/football/teams/66.png',
  'Newcastle': 'https://media.api-sports.io/football/teams/34.png',
  'Man United': 'https://media.api-sports.io/football/teams/33.png',
  'Brighton': 'https://media.api-sports.io/football/teams/51.png',
  'West Ham': 'https://media.api-sports.io/football/teams/48.png',
  'Real Madrid': 'https://media.api-sports.io/football/teams/541.png',
  'Barcelona': 'https://media.api-sports.io/football/teams/529.png',
  'Atletico Madrid': 'https://media.api-sports.io/football/teams/530.png',
  'Athletic Club': 'https://media.api-sports.io/football/teams/531.png',
  'Real Sociedad': 'https://media.api-sports.io/football/teams/548.png',
  'Villarreal': 'https://media.api-sports.io/football/teams/533.png',
  'Real Betis': 'https://media.api-sports.io/football/teams/536.png',
  'Sevilla': 'https://media.api-sports.io/football/teams/536.png',
  'Bayern Munich': 'https://media.api-sports.io/football/teams/157.png',
  'Borussia Dortmund': 'https://media.api-sports.io/football/teams/165.png',
  'RB Leipzig': 'https://media.api-sports.io/football/teams/173.png',
  'Bayer Leverkusen': 'https://media.api-sports.io/football/teams/168.png',
  'Stuttgart': 'https://media.api-sports.io/football/teams/172.png',
  'Wolfsburg': 'https://media.api-sports.io/football/teams/161.png',
  'Inter Milan': 'https://media.api-sports.io/football/teams/505.png',
  'Napoli': 'https://media.api-sports.io/football/teams/492.png',
  'Juventus': 'https://media.api-sports.io/football/teams/496.png',
  'AC Milan': 'https://media.api-sports.io/football/teams/489.png',
  'Atalanta': 'https://media.api-sports.io/football/teams/499.png',
  'Roma': 'https://media.api-sports.io/football/teams/497.png',
  'Lazio': 'https://media.api-sports.io/football/teams/487.png',
  'PSG': 'https://media.api-sports.io/football/teams/85.png',
  'Marseille': 'https://media.api-sports.io/football/teams/81.png',
  'Monaco': 'https://media.api-sports.io/football/teams/91.png',
  'Lyon': 'https://media.api-sports.io/football/teams/80.png',
  'Lille': 'https://media.api-sports.io/football/teams/79.png',
  'Nice': 'https://media.api-sports.io/football/teams/84.png',
};

function getLogo(team: string): string | null {
  return TEAM_LOGOS[team] || null;
}

// ─── Slug → League Name ────────────────────────────────────

const SLUG_MAP: Record<string, string> = {
  'premier-league': 'Premier League',
  'la-liga': 'La Liga',
  'serie-a': 'Serie A',
  'bundesliga': 'Bundesliga',
  'ligue-1': 'Ligue 1',
};

// ─── Mock League Data ──────────────────────────────────────

function getLeagueProfile(name: string): LeagueProfile {
  const slug = Object.entries(SLUG_MAP).find(([, v]) => v === name)?.[0] || name.toLowerCase().replace(/\s+/g, '-');

  const leagues: Record<string, LeagueProfile> = {
    'Premier League': {
      name: 'Premier League', slug, logoUrl: 'https://media.api-sports.io/football/leagues/39.png',
      country: 'Inggris', season: 2025, founded: 1992, teams: 20, matchesPlayed: 280, totalGoals: 812,
      primaryColor: '#38003C', secondaryColor: '#00FF85',
      standings: [
        { rank: 1, name: 'Liverpool', slug: 'liverpool', logoUrl: getLogo('Liverpool'), played: 30, wins: 22, draws: 5, losses: 3, goalsFor: 68, goalsAgainst: 24, points: 71, form: ['W','W','D','W','W'] },
        { rank: 2, name: 'Arsenal', slug: 'arsenal', logoUrl: getLogo('Arsenal'), played: 30, wins: 21, draws: 5, losses: 4, goalsFor: 62, goalsAgainst: 22, points: 68, form: ['W','L','W','W','D'] },
        { rank: 3, name: 'Man United', slug: 'man-united', logoUrl: getLogo('Man United'), played: 30, wins: 20, draws: 4, losses: 6, goalsFor: 58, goalsAgainst: 28, points: 64, form: ['W','W','L','W','W'] },
        { rank: 4, name: 'Manchester City', slug: 'manchester-city', logoUrl: getLogo('Manchester City'), played: 30, wins: 19, draws: 5, losses: 6, goalsFor: 60, goalsAgainst: 30, points: 62, form: ['L','W','D','W','L'] },
        { rank: 5, name: 'Newcastle', slug: 'newcastle', logoUrl: getLogo('Newcastle'), played: 30, wins: 17, draws: 6, losses: 7, goalsFor: 55, goalsAgainst: 32, points: 57, form: ['W','D','W','L','W'] },
        { rank: 6, name: 'Aston Villa', slug: 'aston-villa', logoUrl: getLogo('Aston Villa'), played: 30, wins: 16, draws: 5, losses: 9, goalsFor: 52, goalsAgainst: 38, points: 53, form: ['D','W','W','L','W'] },
        { rank: 7, name: 'Chelsea', slug: 'chelsea', logoUrl: getLogo('Chelsea'), played: 30, wins: 15, draws: 6, losses: 9, goalsFor: 50, goalsAgainst: 36, points: 51, form: ['W','L','D','W','D'] },
        { rank: 8, name: 'Tottenham', slug: 'tottenham', logoUrl: getLogo('Tottenham'), played: 30, wins: 14, draws: 5, losses: 11, goalsFor: 56, goalsAgainst: 42, points: 47, form: ['L','W','W','L','D'] },
        { rank: 9, name: 'Brighton', slug: 'brighton', logoUrl: getLogo('Brighton'), played: 30, wins: 12, draws: 8, losses: 10, goalsFor: 45, goalsAgainst: 40, points: 44, form: ['D','D','W','W','L'] },
        { rank: 10, name: 'West Ham', slug: 'west-ham', logoUrl: getLogo('West Ham'), played: 30, wins: 11, draws: 7, losses: 12, goalsFor: 40, goalsAgainst: 44, points: 40, form: ['L','D','W','L','W'] },
      ],
      recentMatches: [
        { id: 'pl-1', homeTeam: 'Arsenal', awayTeam: 'Manchester City', homeScore: 2, awayScore: 1, matchDate: new Date().toISOString().split('T')[0], venue: 'Emirates Stadium', matchWeek: 30, status: 'finished', homeTeamLogoUrl: getLogo('Arsenal'), awayTeamLogoUrl: getLogo('Manchester City') },
        { id: 'pl-2', homeTeam: 'Liverpool', awayTeam: 'Chelsea', homeScore: 3, awayScore: 1, matchDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], venue: 'Anfield', matchWeek: 30, status: 'finished', homeTeamLogoUrl: getLogo('Liverpool'), awayTeamLogoUrl: getLogo('Chelsea') },
        { id: 'pl-3', homeTeam: 'Newcastle', awayTeam: 'Tottenham', homeScore: 1, awayScore: 1, matchDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], venue: 'St James\' Park', matchWeek: 30, status: 'finished', homeTeamLogoUrl: getLogo('Newcastle'), awayTeamLogoUrl: getLogo('Tottenham') },
        { id: 'pl-4', homeTeam: 'Man United', awayTeam: 'Aston Villa', homeScore: 2, awayScore: 0, matchDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], venue: 'Old Trafford', matchWeek: 30, status: 'finished', homeTeamLogoUrl: getLogo('Man United'), awayTeamLogoUrl: getLogo('Aston Villa') },
        { id: 'pl-5', homeTeam: 'Brighton', awayTeam: 'West Ham', homeScore: 1, awayScore: 0, matchDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], venue: 'Amex Stadium', matchWeek: 30, status: 'finished', homeTeamLogoUrl: getLogo('Brighton'), awayTeamLogoUrl: getLogo('West Ham') },
      ],
      topScorers: [
        { rank: 1, name: 'Mohamed Salah', team: 'Liverpool', teamSlug: 'liverpool', goals: 22, assists: 13, teamLogoUrl: getLogo('Liverpool') },
        { rank: 2, name: 'Erling Haaland', team: 'Manchester City', teamSlug: 'manchester-city', goals: 20, assists: 5, teamLogoUrl: getLogo('Manchester City') },
        { rank: 3, name: 'Bukayo Saka', team: 'Arsenal', teamSlug: 'arsenal', goals: 16, assists: 10, teamLogoUrl: getLogo('Arsenal') },
        { rank: 4, name: 'Alexander Isak', team: 'Newcastle', teamSlug: 'newcastle', goals: 15, assists: 6, teamLogoUrl: getLogo('Newcastle') },
        { rank: 5, name: 'Bryan Mbeumo', team: 'Brentford', teamSlug: 'brentford', goals: 14, assists: 4, teamLogoUrl: null },
      ],
    },
    'La Liga': {
      name: 'La Liga', slug, logoUrl: 'https://media.api-sports.io/football/leagues/140.png',
      country: 'Spanyol', season: 2025, founded: 1929, teams: 20, matchesPlayed: 275, totalGoals: 738,
      primaryColor: '#EE8707', secondaryColor: '#FF4F4F',
      standings: [
        { rank: 1, name: 'Real Madrid', slug: 'real-madrid', logoUrl: getLogo('Real Madrid'), played: 30, wins: 23, draws: 4, losses: 3, goalsFor: 70, goalsAgainst: 22, points: 73, form: ['D','W','W','W','W'] },
        { rank: 2, name: 'Barcelona', slug: 'barcelona', logoUrl: getLogo('Barcelona'), played: 30, wins: 22, draws: 5, losses: 3, goalsFor: 72, goalsAgainst: 26, points: 71, form: ['W','W','D','W','L'] },
        { rank: 3, name: 'Atletico Madrid', slug: 'atletico-madrid', logoUrl: getLogo('Atletico Madrid'), played: 30, wins: 20, draws: 6, losses: 4, goalsFor: 54, goalsAgainst: 20, points: 66, form: ['W','D','W','W','D'] },
        { rank: 4, name: 'Athletic Club', slug: 'athletic-club', logoUrl: getLogo('Athletic Club'), played: 30, wins: 17, draws: 7, losses: 6, goalsFor: 48, goalsAgainst: 30, points: 58, form: ['D','W','L','W','W'] },
        { rank: 5, name: 'Real Sociedad', slug: 'real-sociedad', logoUrl: getLogo('Real Sociedad'), played: 30, wins: 15, draws: 8, losses: 7, goalsFor: 42, goalsAgainst: 32, points: 53, form: ['W','D','D','W','L'] },
        { rank: 6, name: 'Villarreal', slug: 'villarreal', logoUrl: getLogo('Villarreal'), played: 30, wins: 14, draws: 7, losses: 9, goalsFor: 50, goalsAgainst: 38, points: 49, form: ['L','W','W','D','W'] },
        { rank: 7, name: 'Real Betis', slug: 'real-betis', logoUrl: getLogo('Real Betis'), played: 30, wins: 13, draws: 8, losses: 9, goalsFor: 40, goalsAgainst: 36, points: 47, form: ['D','W','L','W','D'] },
        { rank: 8, name: 'Sevilla', slug: 'sevilla', logoUrl: getLogo('Sevilla'), played: 30, wins: 12, draws: 8, losses: 10, goalsFor: 38, goalsAgainst: 40, points: 44, form: ['L','D','W','L','W'] },
      ],
      recentMatches: [
        { id: 'll-1', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeScore: 3, awayScore: 3, matchDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], venue: 'Santiago Bernabéu', matchWeek: 30, status: 'finished', homeTeamLogoUrl: getLogo('Real Madrid'), awayTeamLogoUrl: getLogo('Barcelona') },
        { id: 'll-2', homeTeam: 'Barcelona', awayTeam: 'Atletico Madrid', homeScore: 1, awayScore: 0, matchDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], venue: 'Camp Nou', matchWeek: 30, status: 'finished', homeTeamLogoUrl: getLogo('Barcelona'), awayTeamLogoUrl: getLogo('Atletico Madrid') },
        { id: 'll-3', homeTeam: 'Athletic Club', awayTeam: 'Real Sociedad', homeScore: 2, awayScore: 1, matchDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], venue: 'San Mamés', matchWeek: 30, status: 'finished', homeTeamLogoUrl: getLogo('Athletic Club'), awayTeamLogoUrl: getLogo('Real Sociedad') },
        { id: 'll-4', homeTeam: 'Villarreal', awayTeam: 'Real Madrid', homeScore: 0, awayScore: 3, matchDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], venue: 'Estadio de la Cerámica', matchWeek: 29, status: 'finished', homeTeamLogoUrl: getLogo('Villarreal'), awayTeamLogoUrl: getLogo('Real Madrid') },
      ],
      topScorers: [
        { rank: 1, name: 'Robert Lewandowski', team: 'Barcelona', teamSlug: 'barcelona', goals: 24, assists: 6, teamLogoUrl: getLogo('Barcelona') },
        { rank: 2, name: 'Kylian Mbappé', team: 'Real Madrid', teamSlug: 'real-madrid', goals: 21, assists: 7, teamLogoUrl: getLogo('Real Madrid') },
        { rank: 3, name: 'Antoine Griezmann', team: 'Atletico Madrid', teamSlug: 'atletico-madrid', goals: 14, assists: 9, teamLogoUrl: getLogo('Atletico Madrid') },
        { rank: 4, name: 'Vinícius Júnior', team: 'Real Madrid', teamSlug: 'real-madrid', goals: 13, assists: 8, teamLogoUrl: getLogo('Real Madrid') },
        { rank: 5, name: 'Lamine Yamal', team: 'Barcelona', teamSlug: 'barcelona', goals: 12, assists: 11, teamLogoUrl: getLogo('Barcelona') },
      ],
    },
    'Serie A': {
      name: 'Serie A', slug, logoUrl: 'https://media.api-sports.io/football/leagues/135.png',
      country: 'Italia', season: 2025, founded: 1898, teams: 20, matchesPlayed: 270, totalGoals: 695,
      primaryColor: '#008FD5', secondaryColor: '#024494',
      standings: [
        { rank: 1, name: 'Inter Milan', slug: 'inter-milan', logoUrl: getLogo('Inter Milan'), played: 30, wins: 22, draws: 5, losses: 3, goalsFor: 65, goalsAgainst: 20, points: 71, form: ['W','W','D','W','W'] },
        { rank: 2, name: 'Napoli', slug: 'napoli', logoUrl: getLogo('Napoli'), played: 30, wins: 20, draws: 6, losses: 4, goalsFor: 60, goalsAgainst: 24, points: 66, form: ['W','D','W','W','L'] },
        { rank: 3, name: 'Juventus', slug: 'juventus', logoUrl: getLogo('Juventus'), played: 30, wins: 18, draws: 7, losses: 5, goalsFor: 50, goalsAgainst: 22, points: 61, form: ['D','W','W','D','W'] },
        { rank: 4, name: 'AC Milan', slug: 'ac-milan', logoUrl: getLogo('AC Milan'), played: 30, wins: 17, draws: 6, losses: 7, goalsFor: 55, goalsAgainst: 32, points: 57, form: ['L','W','D','W','W'] },
        { rank: 5, name: 'Atalanta', slug: 'atalanta', logoUrl: getLogo('Atalanta'), played: 30, wins: 16, draws: 5, losses: 9, goalsFor: 58, goalsAgainst: 38, points: 53, form: ['W','W','L','W','D'] },
        { rank: 6, name: 'Roma', slug: 'roma', logoUrl: getLogo('Roma'), played: 30, wins: 14, draws: 7, losses: 9, goalsFor: 46, goalsAgainst: 36, points: 49, form: ['D','L','W','W','L'] },
        { rank: 7, name: 'Lazio', slug: 'lazio', logoUrl: getLogo('Lazio'), played: 30, wins: 13, draws: 6, losses: 11, goalsFor: 44, goalsAgainst: 40, points: 45, form: ['L','W','D','L','W'] },
      ],
      recentMatches: [
        { id: 'sa-1', homeTeam: 'AC Milan', awayTeam: 'Inter Milan', homeScore: 1, awayScore: 2, matchDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], venue: 'San Siro', matchWeek: 30, status: 'finished', homeTeamLogoUrl: getLogo('AC Milan'), awayTeamLogoUrl: getLogo('Inter Milan') },
        { id: 'sa-2', homeTeam: 'Napoli', awayTeam: 'Juventus', homeScore: 2, awayScore: 1, matchDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], venue: 'Diego Armando Maradona', matchWeek: 30, status: 'finished', homeTeamLogoUrl: getLogo('Napoli'), awayTeamLogoUrl: getLogo('Juventus') },
        { id: 'sa-3', homeTeam: 'Atalanta', awayTeam: 'Roma', homeScore: 3, awayScore: 1, matchDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], venue: 'Gewiss Stadium', matchWeek: 30, status: 'finished', homeTeamLogoUrl: getLogo('Atalanta'), awayTeamLogoUrl: getLogo('Roma') },
        { id: 'sa-4', homeTeam: 'Lazio', awayTeam: 'AC Milan', homeScore: 1, awayScore: 1, matchDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], venue: 'Stadio Olimpico', matchWeek: 29, status: 'finished', homeTeamLogoUrl: getLogo('Lazio'), awayTeamLogoUrl: getLogo('AC Milan') },
      ],
      topScorers: [
        { rank: 1, name: 'Lautaro Martínez', team: 'Inter Milan', teamSlug: 'inter-milan', goals: 22, assists: 5, teamLogoUrl: getLogo('Inter Milan') },
        { rank: 2, name: 'Romelu Lukaku', team: 'Napoli', teamSlug: 'napoli', goals: 18, assists: 4, teamLogoUrl: getLogo('Napoli') },
        { rank: 3, name: 'Dušan Vlahović', team: 'Juventus', teamSlug: 'juventus', goals: 14, assists: 3, teamLogoUrl: getLogo('Juventus') },
        { rank: 4, name: 'Rafael Leão', team: 'AC Milan', teamSlug: 'ac-milan', goals: 13, assists: 9, teamLogoUrl: getLogo('AC Milan') },
        { rank: 5, name: 'Ademola Lookman', team: 'Atalanta', teamSlug: 'atalanta', goals: 12, assists: 7, teamLogoUrl: getLogo('Atalanta') },
      ],
    },
    'Bundesliga': {
      name: 'Bundesliga', slug, logoUrl: 'https://media.api-sports.io/football/leagues/78.png',
      country: 'Jerman', season: 2025, founded: 1963, teams: 18, matchesPlayed: 243, totalGoals: 780,
      primaryColor: '#D20515', secondaryColor: '#000000',
      standings: [
        { rank: 1, name: 'Bayern Munich', slug: 'bayern-munich', logoUrl: getLogo('Bayern Munich'), played: 28, wins: 21, draws: 3, losses: 4, goalsFor: 72, goalsAgainst: 26, points: 66, form: ['W','W','W','L','W'] },
        { rank: 2, name: 'Bayer Leverkusen', slug: 'bayer-leverkusen', logoUrl: getLogo('Bayer Leverkusen'), played: 28, wins: 19, draws: 6, losses: 3, goalsFor: 60, goalsAgainst: 22, points: 63, form: ['D','W','W','W','D'] },
        { rank: 3, name: 'Borussia Dortmund', slug: 'borussia-dortmund', logoUrl: getLogo('Borussia Dortmund'), played: 28, wins: 17, draws: 4, losses: 7, goalsFor: 56, goalsAgainst: 34, points: 55, form: ['L','W','D','W','W'] },
        { rank: 4, name: 'RB Leipzig', slug: 'rb-leipzig', logoUrl: getLogo('RB Leipzig'), played: 28, wins: 16, draws: 5, losses: 7, goalsFor: 52, goalsAgainst: 32, points: 53, form: ['W','L','W','W','D'] },
        { rank: 5, name: 'Stuttgart', slug: 'stuttgart', logoUrl: getLogo('Stuttgart'), played: 28, wins: 14, draws: 6, losses: 8, goalsFor: 50, goalsAgainst: 38, points: 48, form: ['D','W','L','D','W'] },
        { rank: 6, name: 'Wolfsburg', slug: 'wolfsburg', logoUrl: getLogo('Wolfsburg'), played: 28, wins: 12, draws: 7, losses: 9, goalsFor: 44, goalsAgainst: 40, points: 43, form: ['L','D','W','W','L'] },
      ],
      recentMatches: [
        { id: 'bl-1', homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund', homeScore: 4, awayScore: 2, matchDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], venue: 'Allianz Arena', matchWeek: 27, status: 'finished', homeTeamLogoUrl: getLogo('Bayern Munich'), awayTeamLogoUrl: getLogo('Borussia Dortmund') },
        { id: 'bl-2', homeTeam: 'Bayer Leverkusen', awayTeam: 'RB Leipzig', homeScore: 2, awayScore: 0, matchDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], venue: 'BayArena', matchWeek: 27, status: 'finished', homeTeamLogoUrl: getLogo('Bayer Leverkusen'), awayTeamLogoUrl: getLogo('RB Leipzig') },
        { id: 'bl-3', homeTeam: 'Stuttgart', awayTeam: 'Wolfsburg', homeScore: 3, awayScore: 1, matchDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], venue: 'MHPArena', matchWeek: 27, status: 'finished', homeTeamLogoUrl: getLogo('Stuttgart'), awayTeamLogoUrl: getLogo('Wolfsburg') },
      ],
      topScorers: [
        { rank: 1, name: 'Harry Kane', team: 'Bayern Munich', teamSlug: 'bayern-munich', goals: 28, assists: 8, teamLogoUrl: getLogo('Bayern Munich') },
        { rank: 2, name: 'Loïs Openda', team: 'RB Leipzig', teamSlug: 'rb-leipzig', goals: 18, assists: 6, teamLogoUrl: getLogo('RB Leipzig') },
        { rank: 3, name: 'Serhou Guirassy', team: 'Borussia Dortmund', teamSlug: 'borussia-dortmund', goals: 16, assists: 5, teamLogoUrl: getLogo('Borussia Dortmund') },
        { rank: 4, name: 'Victor Boniface', team: 'Bayer Leverkusen', teamSlug: 'bayer-leverkusen', goals: 14, assists: 7, teamLogoUrl: getLogo('Bayer Leverkusen') },
        { rank: 5, name: 'Jamal Musiala', team: 'Bayern Munich', teamSlug: 'bayern-munich', goals: 12, assists: 10, teamLogoUrl: getLogo('Bayern Munich') },
      ],
    },
    'Ligue 1': {
      name: 'Ligue 1', slug, logoUrl: 'https://media.api-sports.io/football/leagues/61.png',
      country: 'Prancis', season: 2025, founded: 1932, teams: 18, matchesPlayed: 243, totalGoals: 650,
      primaryColor: '#091C3E', secondaryColor: '#DA291C',
      standings: [
        { rank: 1, name: 'PSG', slug: 'psg', logoUrl: getLogo('PSG'), played: 27, wins: 21, draws: 3, losses: 3, goalsFor: 66, goalsAgainst: 18, points: 66, form: ['W','W','D','W','W'] },
        { rank: 2, name: 'Marseille', slug: 'marseille', logoUrl: getLogo('Marseille'), played: 27, wins: 17, draws: 5, losses: 5, goalsFor: 52, goalsAgainst: 28, points: 56, form: ['L','W','W','D','W'] },
        { rank: 3, name: 'Monaco', slug: 'monaco', logoUrl: getLogo('Monaco'), played: 27, wins: 16, draws: 4, losses: 7, goalsFor: 48, goalsAgainst: 30, points: 52, form: ['W','D','W','L','W'] },
        { rank: 4, name: 'Lyon', slug: 'lyon', logoUrl: getLogo('Lyon'), played: 27, wins: 14, draws: 5, losses: 8, goalsFor: 46, goalsAgainst: 34, points: 47, form: ['W','L','D','W','L'] },
        { rank: 5, name: 'Lille', slug: 'lille', logoUrl: getLogo('Lille'), played: 27, wins: 13, draws: 6, losses: 8, goalsFor: 42, goalsAgainst: 32, points: 45, form: ['D','W','W','L','D'] },
        { rank: 6, name: 'Nice', slug: 'nice', logoUrl: getLogo('Nice'), played: 27, wins: 12, draws: 7, losses: 8, goalsFor: 38, goalsAgainst: 30, points: 43, form: ['D','D','L','W','W'] },
      ],
      recentMatches: [
        { id: 'l1-1', homeTeam: 'PSG', awayTeam: 'Marseille', homeScore: 2, awayScore: 0, matchDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], venue: 'Parc des Princes', matchWeek: 26, status: 'finished', homeTeamLogoUrl: getLogo('PSG'), awayTeamLogoUrl: getLogo('Marseille') },
        { id: 'l1-2', homeTeam: 'Monaco', awayTeam: 'Lyon', homeScore: 3, awayScore: 2, matchDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], venue: 'Stade Louis II', matchWeek: 26, status: 'finished', homeTeamLogoUrl: getLogo('Monaco'), awayTeamLogoUrl: getLogo('Lyon') },
        { id: 'l1-3', homeTeam: 'Lille', awayTeam: 'Nice', homeScore: 1, awayScore: 1, matchDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], venue: 'Stade Pierre-Mauroy', matchWeek: 26, status: 'finished', homeTeamLogoUrl: getLogo('Lille'), awayTeamLogoUrl: getLogo('Nice') },
        { id: 'l1-4', homeTeam: 'PSG', awayTeam: 'Lyon', homeScore: 4, awayScore: 1, matchDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], venue: 'Parc des Princes', matchWeek: 25, status: 'finished', homeTeamLogoUrl: getLogo('PSG'), awayTeamLogoUrl: getLogo('Lyon') },
      ],
      topScorers: [
        { rank: 1, name: 'Jonathan David', team: 'Lille', teamSlug: 'lille', goals: 18, assists: 5, teamLogoUrl: getLogo('Lille') },
        { rank: 2, name: 'Bradley Barcola', team: 'PSG', teamSlug: 'psg', goals: 16, assists: 10, teamLogoUrl: getLogo('PSG') },
        { rank: 3, name: 'Mason Greenwood', team: 'Marseille', teamSlug: 'marseille', goals: 14, assists: 6, teamLogoUrl: getLogo('Marseille') },
        { rank: 4, name: 'Ousmane Dembélé', team: 'PSG', teamSlug: 'psg', goals: 12, assists: 12, teamLogoUrl: getLogo('PSG') },
        { rank: 5, name: 'Alexandre Lacazette', team: 'Lyon', teamSlug: 'lyon', goals: 11, assists: 4, teamLogoUrl: getLogo('Lyon') },
      ],
    },
  };

  if (!leagues[name]) {
    return {
      name, slug,
      logoUrl: null, country: '-', season: 2025, founded: null,
      teams: 0, matchesPlayed: 0, totalGoals: 0,
      primaryColor: '#00F3FF', secondaryColor: '#0099CC',
      standings: [], recentMatches: [], topScorers: [],
    };
  }
  return leagues[name];
}

// ─── GET /api/leagues/[slug] ────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const leagueName = SLUG_MAP[slug] || null;

  if (!leagueName) {
    return NextResponse.json(
      { success: false, error: `Liga '${slug}' tidak ditemukan` },
      { status: 404 }
    );
  }

  // Try Supabase for recent matches
  try {
    const supabase = createServerSupabaseClient();
    const { data: matches, error } = await supabase
      .from('match_results')
      .select('*')
      .eq('league', leagueName)
      .order('match_date', { ascending: false })
      .limit(8);

    if (!error && matches && matches.length > 0) {
      const recentMatches = matches.map((m: any) => ({
        id: m.id, homeTeam: m.home_team, awayTeam: m.away_team,
        homeScore: m.home_score, awayScore: m.away_score,
        matchDate: m.match_date, venue: m.venue, matchWeek: m.match_week,
        status: m.status, homeTeamLogoUrl: m.home_team_logo_url, awayTeamLogoUrl: m.away_team_logo_url,
      }));
      const profile = getLeagueProfile(leagueName);
      return NextResponse.json({ success: true, league: { ...profile, recentMatches }, source: 'supabase' });
    }
  } catch (err: any) {
    console.warn(`[leagues/${slug}] Supabase error: ${err.message}, using mock`);
  }

  return NextResponse.json({ success: true, league: getLeagueProfile(leagueName), source: 'mock' });
}
