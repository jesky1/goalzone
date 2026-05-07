import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export const revalidate = 300;

// ─── Types ──────────────────────────────────────────────────

interface SquadPlayer {
  id: number;
  name: string;
  number: number;
  position: string;
  nationality: string;
  age: number;
  photo: string | null;
}

interface TeamLineup {
  formation: string;
  players: { name: string; number: number; position: string; gridArea: string }[];
}

interface TeamMatchResult {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  league: string | null;
  status: string;
  homeTeamLogoUrl: string | null;
  awayTeamLogoUrl: string | null;
  venue: string | null;
  matchWeek: number | null;
}

interface TeamProfile {
  name: string;
  slug: string;
  logoUrl: string | null;
  founded: number | null;
  stadium: string | null;
  stadiumCapacity: number | null;
  coach: string | null;
  league: string | null;
  country: string | null;
  season: number;
  // Accent colors (hex)
  primaryColor: string;
  secondaryColor: string;
  // Stats
  rank: number | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  // Squad & Lineup
  squad: SquadPlayer[];
  lastLineup: TeamLineup | null;
  // Recent matches
  recentMatches: TeamMatchResult[];
}

// ─── Team Logo Map ──────────────────────────────────────────

const TEAM_LOGOS: Record<string, string> = {
  'Manchester City': 'https://media.api-sports.io/football/teams/50.png',
  'Real Madrid': 'https://media.api-sports.io/football/teams/541.png',
  'Barcelona': 'https://media.api-sports.io/football/teams/529.png',
  'Bayern Munich': 'https://media.api-sports.io/football/teams/157.png',
  'PSG': 'https://media.api-sports.io/football/teams/85.png',
  'Arsenal': 'https://media.api-sports.io/football/teams/42.png',
  'Liverpool': 'https://media.api-sports.io/football/teams/40.png',
  'Chelsea': 'https://media.api-sports.io/football/teams/49.png',
  'AC Milan': 'https://media.api-sports.io/football/teams/489.png',
  'Inter Milan': 'https://media.api-sports.io/football/teams/505.png',
  'Juventus': 'https://media.api-sports.io/football/teams/496.png',
  'Napoli': 'https://media.api-sports.io/football/teams/492.png',
  'Borussia Dortmund': 'https://media.api-sports.io/football/teams/165.png',
  'RB Leipzig': 'https://media.api-sports.io/football/teams/173.png',
  'Marseille': 'https://media.api-sports.io/football/teams/81.png',
};

// ─── Slug → Team Name Mapping ───────────────────────────────

const SLUG_MAP: Record<string, string> = {
  'manchester-city': 'Manchester City',
  'real-madrid': 'Real Madrid',
  'barcelona': 'Barcelona',
  'bayern-munich': 'Bayern Munich',
  'psg': 'PSG',
  'arsenal': 'Arsenal',
  'liverpool': 'Liverpool',
  'chelsea': 'Chelsea',
  'ac-milan': 'AC Milan',
  'inter-milan': 'Inter Milan',
  'juventus': 'Juventus',
  'napoli': 'Napoli',
  'borussia-dortmund': 'Borussia Dortmund',
  'rb-leipzig': 'RB Leipzig',
  'marseille': 'Marseille',
};

// ─── Mock Team Profiles ─────────────────────────────────────

function getTeamProfile(teamName: string): TeamProfile {
  const slug = Object.entries(SLUG_MAP).find(([, v]) => v === teamName)?.[0] || teamName.toLowerCase().replace(/\s+/g, '-');

  const profiles: Record<string, TeamProfile> = {
    'Real Madrid': {
      name: 'Real Madrid',
      slug,
      logoUrl: TEAM_LOGOS['Real Madrid'],
      founded: 1902,
      stadium: 'Santiago Bernabéu',
      stadiumCapacity: 83186,
      coach: 'Carlo Ancelotti',
      league: 'La Liga',
      country: 'Spanyol',
      season: 2025,
      primaryColor: '#FFFFFF',
      secondaryColor: '#FEBE10',
      rank: 1,
      played: 29,
      wins: 22,
      draws: 4,
      losses: 3,
      goalsFor: 65,
      goalsAgainst: 22,
      points: 70,
      squad: [
        { id: 1, name: 'Thibaut Courtois', number: 1, position: 'GK', nationality: 'Belgia', age: 32, photo: null },
        { id: 2, name: 'Dani Carvajal', number: 2, position: 'DEF', nationality: 'Spanyol', age: 32, photo: null },
        { id: 3, name: 'Éder Militão', number: 3, position: 'DEF', nationality: 'Brasil', age: 26, photo: null },
        { id: 4, name: 'David Alaba', number: 4, position: 'DEF', nationality: 'Austria', age: 32, photo: null },
        { id: 5, name: 'Jude Bellingham', number: 5, position: 'MID', nationality: 'Inggris', age: 21, photo: null },
        { id: 6, name: 'Federico Valverde', number: 15, position: 'MID', nationality: 'Uruguay', age: 26, photo: null },
        { id: 7, name: 'Eduardo Camavinga', number: 12, position: 'MID', nationality: 'Prancis', age: 22, photo: null },
        { id: 8, name: 'Luka Modrić', number: 10, position: 'MID', nationality: 'Kroasia', age: 39, photo: null },
        { id: 9, name: 'Vinícius Júnior', number: 7, position: 'FWD', nationality: 'Brasil', age: 24, photo: null },
        { id: 10, name: 'Kylian Mbappé', number: 9, position: 'FWD', nationality: 'Prancis', age: 26, photo: null },
        { id: 11, name: 'Rodrygo', number: 11, position: 'FWD', nationality: 'Brasil', age: 23, photo: null },
        { id: 12, name: 'Andriy Lunin', number: 13, position: 'GK', nationality: 'Ukraina', age: 25, photo: null },
        { id: 13, name: 'Antonio Rüdiger', number: 22, position: 'DEF', nationality: 'Jerman', age: 31, photo: null },
        { id: 14, name: 'Ferland Mendy', number: 23, position: 'DEF', nationality: 'Prancis', age: 29, photo: null },
        { id: 15, name: 'Aurélien Tchouaméni', number: 18, position: 'MID', nationality: 'Prancis', age: 25, photo: null },
        { id: 16, name: 'Brahim Díaz', number: 21, position: 'FWD', nationality: 'Spanyol', age: 25, photo: null },
        { id: 17, name: 'Endrick', number: 16, position: 'FWD', nationality: 'Brasil', age: 18, photo: null },
        { id: 18, name: 'Fran García', number: 20, position: 'DEF', nationality: 'Spanyol', age: 24, photo: null },
        { id: 19, name: 'Nico Paz', number: 19, position: 'MID', nationality: 'Spanyol', age: 20, photo: null },
        { id: 20, name: 'Arda Güler', number: 14, position: 'MID', nationality: 'Turki', age: 20, photo: null },
      ],
      lastLineup: {
        formation: '4-3-3',
        players: [
          { name: 'Courtois', number: 1, position: 'GK', gridArea: 'gk' },
          { name: 'Carvajal', number: 2, position: 'DEF', gridArea: 'rb' },
          { name: 'Militão', number: 3, position: 'DEF', gridArea: 'rcb' },
          { name: 'Alaba', number: 4, position: 'DEF', gridArea: 'lcb' },
          { name: 'Mendy', number: 23, position: 'DEF', gridArea: 'lb' },
          { name: 'Valverde', number: 15, position: 'MID', gridArea: 'rcm' },
          { name: 'Tchouaméni', number: 18, position: 'MID', gridArea: 'cdm' },
          { name: 'Bellingham', number: 5, position: 'MID', gridArea: 'lcm' },
          { name: 'Rodrygo', number: 11, position: 'FWD', gridArea: 'rw' },
          { name: 'Mbappé', number: 9, position: 'FWD', gridArea: 'st' },
          { name: 'Vinícius Jr', number: 7, position: 'FWD', gridArea: 'lw' },
        ],
      },
      recentMatches: [
        { id: 'mock-rm1', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeScore: 3, awayScore: 3, matchDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], league: 'La Liga', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Real Madrid'], awayTeamLogoUrl: TEAM_LOGOS['Barcelona'], venue: 'Santiago Bernabéu', matchWeek: 30 },
        { id: 'mock-rm2', homeTeam: 'Real Madrid', awayTeam: 'Bayern Munich', homeScore: 2, awayScore: 1, matchDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], league: 'Champions League', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Real Madrid'], awayTeamLogoUrl: TEAM_LOGOS['Bayern Munich'], venue: 'Santiago Bernabéu', matchWeek: null },
        { id: 'mock-rm3', homeTeam: 'Atletico Madrid', awayTeam: 'Real Madrid', homeScore: 1, awayScore: 2, matchDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], league: 'La Liga', status: 'finished', homeTeamLogoUrl: null, awayTeamLogoUrl: TEAM_LOGOS['Real Madrid'], venue: 'Cívitas Metropolitano', matchWeek: 29 },
        { id: 'mock-rm4', homeTeam: 'Real Madrid', awayTeam: 'Napoli', homeScore: 4, awayScore: 2, matchDate: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0], league: 'Champions League', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Real Madrid'], awayTeamLogoUrl: TEAM_LOGOS['Napoli'], venue: 'Santiago Bernabéu', matchWeek: null },
        { id: 'mock-rm5', homeTeam: 'Villarreal', awayTeam: 'Real Madrid', homeScore: 0, awayScore: 3, matchDate: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0], league: 'La Liga', status: 'finished', homeTeamLogoUrl: null, awayTeamLogoUrl: TEAM_LOGOS['Real Madrid'], venue: 'Estadio de la Cerámica', matchWeek: 28 },
      ],
    },
    'Barcelona': {
      name: 'Barcelona',
      slug,
      logoUrl: TEAM_LOGOS['Barcelona'],
      founded: 1899,
      stadium: 'Camp Nou',
      stadiumCapacity: 99354,
      coach: 'Hansi Flick',
      league: 'La Liga',
      country: 'Spanyol',
      season: 2025,
      primaryColor: '#A50044',
      secondaryColor: '#004D98',
      rank: 2,
      played: 29,
      wins: 21,
      draws: 5,
      losses: 3,
      goalsFor: 72,
      goalsAgainst: 25,
      points: 68,
      squad: [
        { id: 1, name: 'Marc-André ter Stegen', number: 1, position: 'GK', nationality: 'Jerman', age: 32, photo: null },
        { id: 2, name: 'Jules Koundé', number: 23, position: 'DEF', nationality: 'Prancis', age: 26, photo: null },
        { id: 3, name: 'Ronald Araújo', number: 4, position: 'DEF', nationality: 'Uruguay', age: 25, photo: null },
        { id: 4, name: 'Pau Cubarsí', number: 2, position: 'DEF', nationality: 'Spanyol', age: 18, photo: null },
        { id: 5, name: 'Alejandro Balde', number: 3, position: 'DEF', nationality: 'Spanyol', age: 21, photo: null },
        { id: 6, name: 'Pedri', number: 8, position: 'MID', nationality: 'Spanyol', age: 22, photo: null },
        { id: 7, name: 'Frenkie de Jong', number: 21, position: 'MID', nationality: 'Belanda', age: 27, photo: null },
        { id: 8, name: 'Gavi', number: 6, position: 'MID', nationality: 'Spanyol', age: 20, photo: null },
        { id: 9, name: 'Marc Casadó', number: 20, position: 'MID', nationality: 'Spanyol', age: 21, photo: null },
        { id: 10, name: 'Robert Lewandowski', number: 9, position: 'FWD', nationality: 'Polandia', age: 36, photo: null },
        { id: 11, name: 'Lamine Yamal', number: 19, position: 'FWD', nationality: 'Spanyol', age: 18, photo: null },
        { id: 12, name: 'Raphinha', number: 11, position: 'FWD', nationality: 'Brasil', age: 28, photo: null },
        { id: 13, name: 'Iñaki Peña', number: 13, position: 'GK', nationality: 'Spanyol', age: 25, photo: null },
        { id: 14, name: 'Andreas Christensen', number: 15, position: 'DEF', nationality: 'Denmark', age: 28, photo: null },
        { id: 15, name: 'Eric García', number: 24, position: 'DEF', nationality: 'Spanyol', age: 24, photo: null },
        { id: 16, name: 'Fermín López', number: 16, position: 'MID', nationality: 'Spanyol', age: 21, photo: null },
        { id: 17, name: 'Ansu Fati', number: 10, position: 'FWD', nationality: 'Spanyol', age: 22, photo: null },
        { id: 18, name: 'Dani Olmo', number: 14, position: 'MID', nationality: 'Spanyol', age: 27, photo: null },
      ],
      lastLineup: {
        formation: '4-3-3',
        players: [
          { name: 'ter Stegen', number: 1, position: 'GK', gridArea: 'gk' },
          { name: 'Koundé', number: 23, position: 'DEF', gridArea: 'rb' },
          { name: 'Araújo', number: 4, position: 'DEF', gridArea: 'rcb' },
          { name: 'Cubarsí', number: 2, position: 'DEF', gridArea: 'lcb' },
          { name: 'Balde', number: 3, position: 'DEF', gridArea: 'lb' },
          { name: 'Pedri', number: 8, position: 'MID', gridArea: 'rcm' },
          { name: 'Casadó', number: 20, position: 'MID', gridArea: 'cdm' },
          { name: 'de Jong', number: 21, position: 'MID', gridArea: 'lcm' },
          { name: 'Yamal', number: 19, position: 'FWD', gridArea: 'rw' },
          { name: 'Lewandowski', number: 9, position: 'FWD', gridArea: 'st' },
          { name: 'Raphinha', number: 11, position: 'FWD', gridArea: 'lw' },
        ],
      },
      recentMatches: [
        { id: 'mock-bar1', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeScore: 3, awayScore: 3, matchDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], league: 'La Liga', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Real Madrid'], awayTeamLogoUrl: TEAM_LOGOS['Barcelona'], venue: 'Santiago Bernabéu', matchWeek: 30 },
        { id: 'mock-bar2', homeTeam: 'Barcelona', awayTeam: 'Atletico Madrid', homeScore: 1, awayScore: 0, matchDate: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], league: 'La Liga', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Barcelona'], awayTeamLogoUrl: null, venue: 'Camp Nou', matchWeek: 29 },
        { id: 'mock-bar3', homeTeam: 'Barcelona', awayTeam: 'PSG', homeScore: 3, awayScore: 1, matchDate: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0], league: 'Champions League', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Barcelona'], awayTeamLogoUrl: TEAM_LOGOS['PSG'], venue: 'Camp Nou', matchWeek: null },
      ],
    },
    'Manchester City': {
      name: 'Manchester City',
      slug,
      logoUrl: TEAM_LOGOS['Manchester City'],
      founded: 1880,
      stadium: 'Etihad Stadium',
      stadiumCapacity: 53400,
      coach: 'Pep Guardiola',
      league: 'Premier League',
      country: 'Inggris',
      season: 2025,
      primaryColor: '#6CABDD',
      secondaryColor: '#1C2C5B',
      rank: 3,
      played: 29,
      wins: 20,
      draws: 4,
      losses: 5,
      goalsFor: 58,
      goalsAgainst: 28,
      points: 64,
      squad: [
        { id: 1, name: 'Ederson', number: 31, position: 'GK', nationality: 'Brasil', age: 30, photo: null },
        { id: 2, name: 'Kyle Walker', number: 2, position: 'DEF', nationality: 'Inggris', age: 34, photo: null },
        { id: 3, name: 'Rúben Dias', number: 3, position: 'DEF', nationality: 'Portugal', age: 27, photo: null },
        { id: 4, name: 'John Stones', number: 5, position: 'DEF', nationality: 'Inggris', age: 30, photo: null },
        { id: 5, name: 'Josko Gvardiol', number: 24, position: 'DEF', nationality: 'Kroasia', age: 23, photo: null },
        { id: 6, name: 'Rodri', number: 16, position: 'MID', nationality: 'Spanyol', age: 28, photo: null },
        { id: 7, name: 'Kevin De Bruyne', number: 17, position: 'MID', nationality: 'Belgia', age: 33, photo: null },
        { id: 8, name: 'Bernardo Silva', number: 20, position: 'MID', nationality: 'Portugal', age: 29, photo: null },
        { id: 9, name: 'Phil Foden', number: 47, position: 'MID', nationality: 'Inggris', age: 25, photo: null },
        { id: 10, name: 'Erling Haaland', number: 9, position: 'FWD', nationality: 'Norwegia', age: 24, photo: null },
        { id: 11, name: 'Jack Grealish', number: 10, position: 'FWD', nationality: 'Inggris', age: 29, photo: null },
        { id: 12, name: 'Jérémy Doku', number: 11, position: 'FWD', nationality: 'Belgia', age: 22, photo: null },
        { id: 13, name: 'Stefan Ortega', number: 18, position: 'GK', nationality: 'Jerman', age: 26, photo: null },
        { id: 14, name: 'Nathan Aké', number: 6, position: 'DEF', nationality: 'Belanda', age: 30, photo: null },
        { id: 15, name: 'Manuel Akanji', number: 25, position: 'DEF', nationality: 'Swiss', age: 29, photo: null },
        { id: 16, name: 'Mateo Kovačić', number: 8, position: 'MID', nationality: 'Kroasia', age: 30, photo: null },
        { id: 17, name: 'Matheus Nunes', number: 27, position: 'MID', nationality: 'Portugal', age: 26, photo: null },
        { id: 18, name: 'Omar Marmoush', number: 7, position: 'FWD', nationality: 'Mesir', age: 26, photo: null },
      ],
      lastLineup: {
        formation: '4-3-3',
        players: [
          { name: 'Ederson', number: 31, position: 'GK', gridArea: 'gk' },
          { name: 'Walker', number: 2, position: 'DEF', gridArea: 'rb' },
          { name: 'Dias', number: 3, position: 'DEF', gridArea: 'rcb' },
          { name: 'Stones', number: 5, position: 'DEF', gridArea: 'lcb' },
          { name: 'Gvardiol', number: 24, position: 'DEF', gridArea: 'lb' },
          { name: 'Rodri', number: 16, position: 'MID', gridArea: 'rcm' },
          { name: 'Kovačić', number: 8, position: 'MID', gridArea: 'cdm' },
          { name: 'De Bruyne', number: 17, position: 'MID', gridArea: 'lcm' },
          { name: 'Doku', number: 11, position: 'FWD', gridArea: 'rw' },
          { name: 'Haaland', number: 9, position: 'FWD', gridArea: 'st' },
          { name: 'Grealish', number: 10, position: 'FWD', gridArea: 'lw' },
        ],
      },
      recentMatches: [
        { id: 'mock-mc1', homeTeam: 'Arsenal', awayTeam: 'Manchester City', homeScore: 2, awayScore: 1, matchDate: new Date().toISOString().split('T')[0], league: 'Premier League', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Arsenal'], awayTeamLogoUrl: TEAM_LOGOS['Manchester City'], venue: 'Emirates Stadium', matchWeek: 28 },
        { id: 'mock-mc2', homeTeam: 'Manchester City', awayTeam: 'Chelsea', homeScore: 3, awayScore: 0, matchDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], league: 'Premier League', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Manchester City'], awayTeamLogoUrl: TEAM_LOGOS['Chelsea'], venue: 'Etihad Stadium', matchWeek: 27 },
        { id: 'mock-mc3', homeTeam: 'Manchester City', awayTeam: 'Liverpool', homeScore: 1, awayScore: 1, matchDate: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0], league: 'Premier League', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Manchester City'], awayTeamLogoUrl: TEAM_LOGOS['Liverpool'], venue: 'Etihad Stadium', matchWeek: 26 },
      ],
    },
    'Bayern Munich': {
      name: 'Bayern Munich',
      slug,
      logoUrl: TEAM_LOGOS['Bayern Munich'],
      founded: 1900,
      stadium: 'Allianz Arena',
      stadiumCapacity: 75024,
      coach: 'Vincent Kompany',
      league: 'Bundesliga',
      country: 'Jerman',
      season: 2025,
      primaryColor: '#DC052D',
      secondaryColor: '#0066B2',
      rank: 1,
      played: 27,
      wins: 20,
      draws: 3,
      losses: 4,
      goalsFor: 68,
      goalsAgainst: 24,
      points: 63,
      squad: [
        { id: 1, name: 'Manuel Neuer', number: 1, position: 'GK', nationality: 'Jerman', age: 38, photo: null },
        { id: 2, name: 'Joshua Kimmich', number: 6, position: 'DEF', nationality: 'Jerman', age: 30, photo: null },
        { id: 3, name: 'Dayot Upamecano', number: 2, position: 'DEF', nationality: 'Prancis', age: 26, photo: null },
        { id: 4, name: 'Kim Min-jae', number: 3, position: 'DEF', nationality: 'Korea Selatan', age: 28, photo: null },
        { id: 5, name: 'Alphonso Davies', number: 19, position: 'DEF', nationality: 'Kanada', age: 24, photo: null },
        { id: 6, name: 'Aleksandar Pavlović', number: 16, position: 'MID', nationality: 'Jerman', age: 20, photo: null },
        { id: 7, name: 'Jamal Musiala', number: 42, position: 'MID', nationality: 'Jerman', age: 22, photo: null },
        { id: 8, name: 'Leroy Sané', number: 10, position: 'MID', nationality: 'Jerman', age: 29, photo: null },
        { id: 9, name: 'Thomas Müller', number: 25, position: 'MID', nationality: 'Jerman', age: 35, photo: null },
        { id: 10, name: 'Harry Kane', number: 9, position: 'FWD', nationality: 'Inggris', age: 31, photo: null },
        { id: 11, name: 'Serge Gnabry', number: 7, position: 'FWD', nationality: 'Jerman', age: 29, photo: null },
        { id: 12, name: 'Lionel Messi', number: 11, position: 'FWD', nationality: 'Argentina', age: 37, photo: null },
        { id: 13, name: 'Sven Ulreich', number: 26, position: 'GK', nationality: 'Jerman', age: 36, photo: null },
        { id: 14, name: 'Sandro Wagner', number: 22, position: 'DEF', nationality: 'Jerman', age: 29, photo: null },
        { id: 15, name: 'Leon Goretzka', number: 8, position: 'MID', nationality: 'Jerman', age: 30, photo: null },
        { id: 16, name: 'Mathys Tel', number: 39, position: 'FWD', nationality: 'Prancis', age: 20, photo: null },
      ],
      lastLineup: {
        formation: '4-2-3-1',
        players: [
          { name: 'Neuer', number: 1, position: 'GK', gridArea: 'gk' },
          { name: 'Kimmich', number: 6, position: 'DEF', gridArea: 'rb' },
          { name: 'Upamecano', number: 2, position: 'DEF', gridArea: 'rcb' },
          { name: 'Kim', number: 3, position: 'DEF', gridArea: 'lcb' },
          { name: 'Davies', number: 19, position: 'DEF', gridArea: 'lb' },
          { name: 'Goretzka', number: 8, position: 'MID', gridArea: 'rcm' },
          { name: 'Pavlović', number: 16, position: 'MID', gridArea: 'lcm' },
          { name: 'Sané', number: 10, position: 'MID', gridArea: 'ram' },
          { name: 'Musiala', number: 42, position: 'MID', gridArea: 'cam' },
          { name: 'Gnabry', number: 7, position: 'FWD', gridArea: 'lam' },
          { name: 'Kane', number: 9, position: 'FWD', gridArea: 'st' },
        ],
      },
      recentMatches: [
        { id: 'mock-bm1', homeTeam: 'Bayern Munich', awayTeam: 'Borussia Dortmund', homeScore: 4, awayScore: 2, matchDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], league: 'Bundesliga', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Bayern Munich'], awayTeamLogoUrl: TEAM_LOGOS['Borussia Dortmund'], venue: 'Allianz Arena', matchWeek: 26 },
        { id: 'mock-bm2', homeTeam: 'Bayern Munich', awayTeam: 'RB Leipzig', homeScore: 2, awayScore: 0, matchDate: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0], league: 'Bundesliga', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Bayern Munich'], awayTeamLogoUrl: TEAM_LOGOS['RB Leipzig'], venue: 'Allianz Arena', matchWeek: 25 },
        { id: 'mock-bm3', homeTeam: 'Real Madrid', awayTeam: 'Bayern Munich', homeScore: 2, awayScore: 1, matchDate: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0], league: 'Champions League', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Real Madrid'], awayTeamLogoUrl: TEAM_LOGOS['Bayern Munich'], venue: 'Santiago Bernabéu', matchWeek: null },
      ],
    },
    'PSG': {
      name: 'PSG',
      slug,
      logoUrl: TEAM_LOGOS['PSG'],
      founded: 1970,
      stadium: 'Parc des Princes',
      stadiumCapacity: 47929,
      coach: 'Luis Enrique',
      league: 'Ligue 1',
      country: 'Prancis',
      season: 2025,
      primaryColor: '#004170',
      secondaryColor: '#DA291C',
      rank: 1,
      played: 26,
      wins: 20,
      draws: 3,
      losses: 3,
      goalsFor: 62,
      goalsAgainst: 18,
      points: 63,
      squad: [
        { id: 1, name: 'Gianluigi Donnarumma', number: 1, position: 'GK', nationality: 'Italia', age: 26, photo: null },
        { id: 2, name: 'Achraf Hakimi', number: 2, position: 'DEF', nationality: 'Maroko', age: 26, photo: null },
        { id: 3, name: 'Marquinhos', number: 5, position: 'DEF', nationality: 'Brasil', age: 30, photo: null },
        { id: 4, name: 'Lucas Hernández', number: 22, position: 'DEF', nationality: 'Prancis', age: 28, photo: null },
        { id: 5, name: 'Nuno Mendes', number: 25, position: 'DEF', nationality: 'Portugal', age: 22, photo: null },
        { id: 6, name: 'Vitinha', number: 17, position: 'MID', nationality: 'Portugal', age: 24, photo: null },
        { id: 7, name: 'Warren Zaïre-Emery', number: 33, position: 'MID', nationality: 'Prancis', age: 19, photo: null },
        { id: 8, name: 'João Neves', number: 40, position: 'MID', nationality: 'Portugal', age: 19, photo: null },
        { id: 9, name: 'Ousmane Dembélé', number: 10, position: 'FWD', nationality: 'Prancis', age: 27, photo: null },
        { id: 10, name: 'Bradley Barcola', number: 29, position: 'FWD', nationality: 'Prancis', age: 22, photo: null },
        { id: 11, name: 'Randal Kolo Muani', number: 9, position: 'FWD', nationality: 'Prancis', age: 26, photo: null },
        { id: 12, name: 'Keylor Navas', number: 16, position: 'GK', nationality: 'Kosta Rika', age: 37, photo: null },
        { id: 13, name: 'Safir Mbegué', number: 41, position: 'DEF', nationality: 'Prancis', age: 20, photo: null },
        { id: 14, name: 'Fabian Ruiz', number: 8, position: 'MID', nationality: 'Spanyol', age: 29, photo: null },
        { id: 15, name: 'Gonçalo Ramos', number: 7, position: 'FWD', nationality: 'Portugal', age: 23, photo: null },
      ],
      lastLineup: {
        formation: '4-3-3',
        players: [
          { name: 'Donnarumma', number: 1, position: 'GK', gridArea: 'gk' },
          { name: 'Hakimi', number: 2, position: 'DEF', gridArea: 'rb' },
          { name: 'Marquinhos', number: 5, position: 'DEF', gridArea: 'rcb' },
          { name: 'Hernández', number: 22, position: 'DEF', gridArea: 'lcb' },
          { name: 'Mendes', number: 25, position: 'DEF', gridArea: 'lb' },
          { name: 'Vitinha', number: 17, position: 'MID', gridArea: 'rcm' },
          { name: 'Zaïre-Emery', number: 33, position: 'MID', gridArea: 'cdm' },
          { name: 'Neves', number: 40, position: 'MID', gridArea: 'lcm' },
          { name: 'Dembélé', number: 10, position: 'FWD', gridArea: 'rw' },
          { name: 'Kolo Muani', number: 9, position: 'FWD', gridArea: 'st' },
          { name: 'Barcola', number: 29, position: 'FWD', gridArea: 'lw' },
        ],
      },
      recentMatches: [
        { id: 'mock-psg1', homeTeam: 'PSG', awayTeam: 'Marseille', homeScore: 2, awayScore: 0, matchDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], league: 'Ligue 1', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['PSG'], awayTeamLogoUrl: TEAM_LOGOS['Marseille'], venue: 'Parc des Princes', matchWeek: 25 },
        { id: 'mock-psg2', homeTeam: 'Barcelona', awayTeam: 'PSG', homeScore: 3, awayScore: 1, matchDate: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0], league: 'Champions League', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['Barcelona'], awayTeamLogoUrl: TEAM_LOGOS['PSG'], venue: 'Camp Nou', matchWeek: null },
        { id: 'mock-psg3', homeTeam: 'PSG', awayTeam: 'Lyon', homeScore: 4, awayScore: 1, matchDate: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0], league: 'Ligue 1', status: 'finished', homeTeamLogoUrl: TEAM_LOGOS['PSG'], awayTeamLogoUrl: null, venue: 'Parc des Princes', matchWeek: 24 },
      ],
    },
  };

  // Fallback for unknown teams
  if (!profiles[teamName]) {
    return {
      name: teamName,
      slug,
      logoUrl: TEAM_LOGOS[teamName] || null,
      founded: null,
      stadium: null,
      stadiumCapacity: null,
      coach: null,
      league: null,
      country: null,
      season: 2025,
      primaryColor: '#00F3FF',
      secondaryColor: '#0099CC',
      rank: null,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      squad: [],
      lastLineup: null,
      recentMatches: [],
    };
  }

  return profiles[teamName];
}

// ─── GET /api/teams/[slug] ──────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const teamName = SLUG_MAP[slug] || null;

  if (!teamName) {
    return NextResponse.json(
      { success: false, error: `Tim '${slug}' tidak ditemukan` },
      { status: 404 }
    );
  }

  // Try Supabase first
  try {
    const supabase = createServerSupabaseClient();

    // Try to find matches involving this team
    const { data: matches, error } = await supabase
      .from('match_results')
      .select('*')
      .or(`home_team.ilike.%${teamName}%,away_team.ilike.%${teamName}%`)
      .order('match_date', { ascending: false })
      .limit(10);

    if (!error && matches && matches.length > 0) {
      // Build team profile from Supabase data
      const recentMatches = matches.map((m: any) => ({
        id: m.id,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        homeScore: m.home_score,
        awayScore: m.away_score,
        matchDate: m.match_date,
        league: m.league,
        status: m.status,
        homeTeamLogoUrl: m.home_team_logo_url,
        awayTeamLogoUrl: m.away_team_logo_url,
        venue: m.venue,
        matchWeek: m.match_week,
      }));

      // Calculate stats from matches
      let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, played = 0;
      for (const m of matches) {
        played++;
        const isHome = m.home_team.toLowerCase().includes(teamName.toLowerCase());
        const scored = isHome ? m.home_score : m.away_score;
        const conceded = isHome ? m.away_score : m.home_score;
        goalsFor += scored;
        goalsAgainst += conceded;
        if (scored > conceded) wins++;
        else if (scored === conceded) draws++;
        else losses++;
      }

      const profile = getTeamProfile(teamName);
      return NextResponse.json({
        success: true,
        team: {
          ...profile,
          played,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          points: wins * 3 + draws,
          recentMatches,
        },
        source: 'supabase',
      });
    }
  } catch (err: any) {
    console.warn(`[teams/${slug}] Supabase error: ${err.message}, using mock`);
  }

  // Fallback to mock data
  const profile = getTeamProfile(teamName);
  return NextResponse.json({
    success: true,
    team: profile,
    source: 'mock',
  });
}
