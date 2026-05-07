import { NextRequest, NextResponse } from 'next/server';

// ISR: cache 5 menit
export const revalidate = 300;

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.NEXT_PUBLIC_FOOTBALL_API_KEY;
const API_BASE = 'https://v3.football.api-sports.io';

// ─── Types ──────────────────────────────────────────────────

interface TeamInfo {
  id: string; name: string; slug: string; logo: string;
  country: string; founded: number | null; venue: string | null;
  venueCapacity: number | null; league: string | null;
}

interface TeamStats {
  standing: number | null; played: number; won: number; drawn: number; lost: number;
  goalsFor: number; goalsAgainst: number; points: number; form: ('W' | 'D' | 'L')[];
}

interface SquadPlayer {
  name: string; number: number | null; position: string; age: number;
  nationality: string; photo: string | null;
}

interface RecentMatch {
  id: string; homeTeam: string; awayTeam: string; homeScore: number; awayScore: number;
  date: string; status: string; league: string | null;
  homeLogo: string | null; awayLogo: string | null; isHome: boolean;
}

interface LineupPlayer {
  name: string; number: number | null; position: string; photo: string | null;
  gridX: string; gridY: string;
}

// ─── Team DB: slug → API-Football ID, colors, formation ────

interface TeamConfig {
  apiId: number; colors: { primary: string; secondary: string; accent: string };
  formation: string; venue: string; venueCapacity: number; founded: number; country: string; league: string;
  leagueId: number;
}

const TEAMS: Record<string, TeamConfig> = {
  'real-madrid':    { apiId: 541, colors: { primary: '#FFFFFF', secondary: '#FFD700', accent: '#FEBE10' }, formation: '4-3-3', venue: 'Santiago Bernabéu', venueCapacity: 81043, founded: 1902, country: 'Spain', league: 'La Liga', leagueId: 140 },
  'barcelona':      { apiId: 529, colors: { primary: '#A50044', secondary: '#004D98', accent: '#FF0033' }, formation: '4-3-3', venue: 'Camp Nou', venueCapacity: 99354, founded: 1899, country: 'Spain', league: 'La Liga', leagueId: 140 },
  'manchester-city':{ apiId: 50,  colors: { primary: '#6CABDD', secondary: '#1C2C5B', accent: '#98C5E9' }, formation: '4-3-3', venue: 'Etihad Stadium', venueCapacity: 53400, founded: 1880, country: 'England', league: 'Premier League', leagueId: 39 },
  'arsenal':        { apiId: 42,  colors: { primary: '#EF0107', secondary: '#FFFFFF', accent: '#DB0007' }, formation: '4-3-3', venue: 'Emirates Stadium', venueCapacity: 60704, founded: 1886, country: 'England', league: 'Premier League', leagueId: 39 },
  'liverpool':      { apiId: 40,  colors: { primary: '#C8102E', secondary: '#00B2A9', accent: '#F0EBD8' }, formation: '4-3-3', venue: 'Anfield', venueCapacity: 61276, founded: 1892, country: 'England', league: 'Premier League', leagueId: 39 },
  'chelsea':        { apiId: 49,  colors: { primary: '#034694', secondary: '#FFFFFF', accent: '#D4AF37' }, formation: '4-2-3-1', venue: 'Stamford Bridge', venueCapacity: 40341, founded: 1905, country: 'England', league: 'Premier League', leagueId: 39 },
  'ac-milan':       { apiId: 489, colors: { primary: '#FB090B', secondary: '#000000', accent: '#E30613' }, formation: '4-2-3-1', venue: 'San Siro', venueCapacity: 75923, founded: 1899, country: 'Italy', league: 'Serie A', leagueId: 135 },
  'inter-milan':    { apiId: 505, colors: { primary: '#009FE3', secondary: '#000000', accent: '#010E80' }, formation: '3-5-2', venue: 'San Siro', venueCapacity: 75923, founded: 1908, country: 'Italy', league: 'Serie A', leagueId: 135 },
  'juventus':       { apiId: 496, colors: { primary: '#000000', secondary: '#FFFFFF', accent: '#D4AF37' }, formation: '3-5-2', venue: 'Allianz Stadium', venueCapacity: 41507, founded: 1897, country: 'Italy', league: 'Serie A', leagueId: 135 },
  'napoli':         { apiId: 492, colors: { primary: '#12A0D7', secondary: '#FFFFFF', accent: '#0066B2' }, formation: '4-3-3', venue: 'Stadio Diego Armando Maradona', venueCapacity: 54000, founded: 1926, country: 'Italy', league: 'Serie A', leagueId: 135 },
  'bayern-munich':  { apiId: 157, colors: { primary: '#DC052D', secondary: '#FFFFFF', accent: '#0066B2' }, formation: '4-2-3-1', venue: 'Allianz Arena', venueCapacity: 75024, founded: 1900, country: 'Germany', league: 'Bundesliga', leagueId: 78 },
  'borussia-dortmund': { apiId: 165, colors: { primary: '#FDE100', secondary: '#000000', accent: '#E2001A' }, formation: '4-3-3', venue: 'Signal Iduna Park', venueCapacity: 81365, founded: 1909, country: 'Germany', league: 'Bundesliga', leagueId: 78 },
  'rb-leipzig':     { apiId: 173, colors: { primary: '#DD0741', secondary: '#FFFFFF', accent: '#00539B' }, formation: '4-4-2', venue: 'Red Bull Arena', venueCapacity: 42458, founded: 2009, country: 'Germany', league: 'Bundesliga', leagueId: 78 },
  'psg':            { apiId: 85,  colors: { primary: '#004170', secondary: '#DA291C', accent: '#C8102E' }, formation: '4-3-3', venue: 'Parc des Princes', venueCapacity: 47929, founded: 1970, country: 'France', league: 'Ligue 1', leagueId: 61 },
  'marseille':      { apiId: 81,  colors: { primary: '#2FAEE0', secondary: '#FFFFFF', accent: '#0055A4' }, formation: '4-2-3-1', venue: 'Stade Vélodrome', venueCapacity: 67394, founded: 1899, country: 'France', league: 'Ligue 1', leagueId: 61 },
};

// ─── Rich Mock Squads ─────────────────────────────────────

const MOCK_SQUADS: Record<string, SquadPlayer[]> = {
  'real-madrid': [
    { name: 'Thibaut Courtois', number: 1, position: 'G', age: 32, nationality: 'Belgium', photo: null },
    { name: 'Andriy Lunin', number: 13, position: 'G', age: 25, nationality: 'Ukraine', photo: null },
    { name: 'Dani Carvajal', number: 2, position: 'D', age: 32, nationality: 'Spain', photo: null },
    { name: 'Éder Militão', number: 3, position: 'D', age: 27, nationality: 'Brazil', photo: null },
    { name: 'David Alaba', number: 4, position: 'D', age: 32, nationality: 'Austria', photo: null },
    { name: 'Ferland Mendy', number: 23, position: 'D', age: 29, nationality: 'France', photo: null },
    { name: 'Fran García', number: 12, position: 'D', age: 24, nationality: 'Spain', photo: null },
    { name: 'Rüdiger', number: 22, position: 'D', age: 31, nationality: 'Germany', photo: null },
    { name: 'Jude Bellingham', number: 5, position: 'M', age: 22, nationality: 'England', photo: null },
    { name: 'Luka Modrić', number: 10, position: 'M', age: 39, nationality: 'Croatia', photo: null },
    { name: 'Toni Kroos', number: 8, position: 'M', age: 34, nationality: 'Germany', photo: null },
    { name: 'Federico Valverde', number: 15, position: 'M', age: 26, nationality: 'Uruguay', photo: null },
    { name: 'Eduardo Camavinga', number: 24, position: 'M', age: 22, nationality: 'France', photo: null },
    { name: 'Aurélien Tchouaméni', number: 18, position: 'M', age: 25, nationality: 'France', photo: null },
    { name: 'Vinícius Jr.', number: 7, position: 'F', age: 24, nationality: 'Brazil', photo: null },
    { name: 'Kylian Mbappé', number: 9, position: 'F', age: 26, nationality: 'France', photo: null },
    { name: 'Rodrygo', number: 11, position: 'F', age: 24, nationality: 'Brazil', photo: null },
    { name: 'Endrick', number: 21, position: 'F', age: 18, nationality: 'Brazil', photo: null },
    { name: 'Brahim Díaz', number: 19, position: 'F', age: 25, nationality: 'Spain', photo: null },
  ],
  'barcelona': [
    { name: 'Marc-André ter Stegen', number: 1, position: 'G', age: 32, nationality: 'Germany', photo: null },
    { name: 'Iñaki Peña', number: 13, position: 'G', age: 25, nationality: 'Spain', photo: null },
    { name: 'Ronald Araújo', number: 4, position: 'D', age: 26, nationality: 'Uruguay', photo: null },
    { name: 'Pau Cubarsí', number: 2, position: 'D', age: 18, nationality: 'Spain', photo: null },
    { name: 'Alejandro Balde', number: 3, position: 'D', age: 21, nationality: 'Spain', photo: null },
    { name: 'Jules Koundé', number: 23, position: 'D', age: 26, nationality: 'France', photo: null },
    { name: 'Andreas Christensen', number: 15, position: 'D', age: 28, nationality: 'Denmark', photo: null },
    { name: 'Pedri', number: 8, position: 'M', age: 22, nationality: 'Spain', photo: null },
    { name: 'Gavi', number: 6, position: 'M', age: 20, nationality: 'Spain', photo: null },
    { name: 'Frenkie de Jong', number: 21, position: 'M', age: 27, nationality: 'Netherlands', photo: null },
    { name: 'Fermin López', number: 16, position: 'M', age: 21, nationality: 'Spain', photo: null },
    { name: 'Robert Lewandowski', number: 9, position: 'F', age: 36, nationality: 'Poland', photo: null },
    { name: 'Raphinha', number: 11, position: 'F', age: 28, nationality: 'Brazil', photo: null },
    { name: 'Lamine Yamal', number: 19, position: 'F', age: 18, nationality: 'Spain', photo: null },
    { name: 'Ansu Fati', number: 10, position: 'F', age: 22, nationality: 'Spain', photo: null },
  ],
  'manchester-city': [
    { name: 'Ederson', number: 31, position: 'G', age: 30, nationality: 'Brazil', photo: null },
    { name: 'Stefan Ortega', number: 18, position: 'G', age: 26, nationality: 'Germany', photo: null },
    { name: 'Kyle Walker', number: 2, position: 'D', age: 34, nationality: 'England', photo: null },
    { name: 'Rúben Dias', number: 3, position: 'D', age: 27, nationality: 'Portugal', photo: null },
    { name: 'Nathan Aké', number: 6, position: 'D', age: 29, nationality: 'Netherlands', photo: null },
    { name: 'Josko Gvardiol', number: 24, position: 'D', age: 23, nationality: 'Croatia', photo: null },
    { name: 'John Stones', number: 5, position: 'D', age: 30, nationality: 'England', photo: null },
    { name: 'Rodri', number: 16, position: 'M', age: 28, nationality: 'Spain', photo: null },
    { name: 'Kevin De Bruyne', number: 17, position: 'M', age: 33, nationality: 'Belgium', photo: null },
    { name: 'Bernardo Silva', number: 20, position: 'M', age: 30, nationality: 'Portugal', photo: null },
    { name: 'Phil Foden', number: 47, position: 'M', age: 24, nationality: 'England', photo: null },
    { name: 'Mateo Kovačić', number: 8, position: 'M', age: 30, nationality: 'Croatia', photo: null },
    { name: 'Erling Haaland', number: 9, position: 'F', age: 24, nationality: 'Norway', photo: null },
    { name: 'Julián Álvarez', number: 19, position: 'F', age: 24, nationality: 'Argentina', photo: null },
    { name: 'Jack Grealish', number: 10, position: 'F', age: 29, nationality: 'England', photo: null },
  ],
  'arsenal': [
    { name: 'David Raya', number: 22, position: 'G', age: 28, nationality: 'Spain', photo: null },
    { name: 'Aaron Ramsdale', number: 1, position: 'G', age: 26, nationality: 'England', photo: null },
    { name: 'Ben White', number: 4, position: 'D', age: 26, nationality: 'England', photo: null },
    { name: 'William Saliba', number: 2, position: 'D', age: 23, nationality: 'France', photo: null },
    { name: 'Gabriel Magalhães', number: 6, position: 'D', age: 27, nationality: 'Brazil', photo: null },
    { name: 'Oleksandr Zinchenko', number: 35, position: 'D', age: 27, nationality: 'Ukraine', photo: null },
    { name: 'Takehiro Tomiyasu', number: 18, position: 'D', age: 25, nationality: 'Japan', photo: null },
    { name: 'Jurrien Timber', number: 12, position: 'D', age: 22, nationality: 'Netherlands', photo: null },
    { name: 'Martin Ødegaard', number: 8, position: 'M', age: 26, nationality: 'Norway', photo: null },
    { name: 'Declan Rice', number: 41, position: 'M', age: 25, nationality: 'England', photo: null },
    { name: 'Kai Havertz', number: 29, position: 'M', age: 25, nationality: 'Germany', photo: null },
    { name: 'Thomas Partey', number: 5, position: 'M', age: 31, nationality: 'Ghana', photo: null },
    { name: 'Bukayo Saka', number: 7, position: 'F', age: 23, nationality: 'England', photo: null },
    { name: 'Gabriel Jesus', number: 9, position: 'F', age: 27, nationality: 'Brazil', photo: null },
    { name: 'Gabriel Martinelli', number: 11, position: 'F', age: 23, nationality: 'Brazil', photo: null },
    { name: 'Leandro Trossard', number: 19, position: 'F', age: 30, nationality: 'Belgium', photo: null },
  ],
  'liverpool': [
    { name: 'Alisson Becker', number: 1, position: 'G', age: 32, nationality: 'Brazil', photo: null },
    { name: 'Caoimhín Kelleher', number: 62, position: 'G', age: 25, nationality: 'Ireland', photo: null },
    { name: 'Trent Alexander-Arnold', number: 66, position: 'D', age: 26, nationality: 'England', photo: null },
    { name: 'Virgil van Dijk', number: 4, position: 'D', age: 33, nationality: 'Netherlands', photo: null },
    { name: 'Ibrahima Konaté', number: 5, position: 'D', age: 25, nationality: 'France', photo: null },
    { name: 'Andrew Robertson', number: 26, position: 'D', age: 31, nationality: 'Scotland', photo: null },
    { name: 'Wataru Endo', number: 3, position: 'M', age: 31, nationality: 'Japan', photo: null },
    { name: 'Alexis Mac Allister', number: 10, position: 'M', age: 26, nationality: 'Argentina', photo: null },
    { name: 'Dominik Szoboszlai', number: 8, position: 'M', age: 24, nationality: 'Hungary', photo: null },
    { name: 'Curtis Jones', number: 17, position: 'M', age: 24, nationality: 'England', photo: null },
    { name: 'Mohamed Salah', number: 11, position: 'F', age: 32, nationality: 'Egypt', photo: null },
    { name: 'Luis Díaz', number: 7, position: 'F', age: 28, nationality: 'Colombia', photo: null },
    { name: 'Darwin Núñez', number: 27, position: 'F', age: 25, nationality: 'Uruguay', photo: null },
    { name: 'Diogo Jota', number: 20, position: 'F', age: 28, nationality: 'Portugal', photo: null },
  ],
  'chelsea': [
    { name: 'Robert Sánchez', number: 1, position: 'G', age: 26, nationality: 'Spain', photo: null },
    { name: 'Reece James', number: 24, position: 'D', age: 25, nationality: 'England', photo: null },
    { name: 'Levi Colwill', number: 6, position: 'D', age: 21, nationality: 'England', photo: null },
    { name: 'Enzo Fernández', number: 8, position: 'M', age: 24, nationality: 'Argentina', photo: null },
    { name: 'Cole Palmer', number: 20, position: 'M', age: 22, nationality: 'England', photo: null },
    { name: 'Moisés Caicedo', number: 25, position: 'M', age: 22, nationality: 'Ecuador', photo: null },
    { name: 'Nicolas Jackson', number: 15, position: 'F', age: 23, nationality: 'Senegal', photo: null },
    { name: 'Noni Madueke', number: 11, position: 'F', age: 22, nationality: 'England', photo: null },
    { name: 'Raheem Sterling', number: 7, position: 'F', age: 30, nationality: 'England', photo: null },
    { name: 'Marc Cucurella', number: 3, position: 'D', age: 26, nationality: 'Spain', photo: null },
    { name: 'Axel Disasi', number: 2, position: 'D', age: 26, nationality: 'France', photo: null },
    { name: 'Wesley Fofana', number: 33, position: 'D', age: 23, nationality: 'France', photo: null },
    { name: 'Romeo Lavia', number: 45, position: 'M', age: 20, nationality: 'Belgium', photo: null },
    { name: 'Christopher Nkunku', number: 18, position: 'F', age: 27, nationality: 'France', photo: null },
  ],
  'ac-milan': [
    { name: 'Mike Maignan', number: 16, position: 'G', age: 29, nationality: 'France', photo: null },
    { name: 'Theo Hernández', number: 19, position: 'D', age: 27, nationality: 'France', photo: null },
    { name: 'Fikayo Tomori', number: 23, position: 'D', age: 27, nationality: 'England', photo: null },
    { name: 'Malick Thiaw', number: 28, position: 'D', age: 23, nationality: 'Germany', photo: null },
    { name: 'Pierre Kalulu', number: 2, position: 'D', age: 24, nationality: 'France', photo: null },
    { name: 'Davide Calabria', number: 2, position: 'D', age: 28, nationality: 'Italy', photo: null },
    { name: 'Rafael Leão', number: 10, position: 'F', age: 26, nationality: 'Portugal', photo: null },
    { name: 'Christian Pulisic', number: 11, position: 'F', age: 26, nationality: 'USA', photo: null },
    { name: 'Rafael Leão', number: 10, position: 'M', age: 26, nationality: 'Portugal', photo: null },
    { name: 'Ismaël Bennacer', number: 4, position: 'M', age: 27, nationality: 'Algeria', photo: null },
    { name: 'Ruben Loftus-Cheek', number: 8, position: 'M', age: 28, nationality: 'England', photo: null },
    { name: 'Tijjani Reijnders', number: 14, position: 'M', age: 26, nationality: 'Netherlands', photo: null },
    { name: 'Olivier Giroud', number: 9, position: 'F', age: 38, nationality: 'France', photo: null },
    { name: 'Noah Okafor', number: 17, position: 'F', age: 24, nationality: 'Switzerland', photo: null },
  ],
  'inter-milan': [
    { name: 'Yann Sommer', number: 1, position: 'G', age: 35, nationality: 'Switzerland', photo: null },
    { name: 'Alessandro Bastoni', number: 95, position: 'D', age: 25, nationality: 'Italy', photo: null },
    { name: 'Francesco Acerbi', number: 15, position: 'D', age: 37, nationality: 'Italy', photo: null },
    { name: 'Benjamin Pavard', number: 28, position: 'D', age: 29, nationality: 'France', photo: null },
    { name: 'Denzel Dumfries', number: 2, position: 'D', age: 28, nationality: 'Netherlands', photo: null },
    { name: 'Henrikh Mkhitaryan', number: 22, position: 'M', age: 35, nationality: 'Armenia', photo: null },
    { name: 'Hakan Çalhanoğlu', number: 20, position: 'M', age: 30, nationality: 'Turkey', photo: null },
    { name: 'Nicolò Barella', number: 23, position: 'M', age: 27, nationality: 'Italy', photo: null },
    { name: 'Lautaro Martínez', number: 10, position: 'F', age: 27, nationality: 'Argentina', photo: null },
    { name: 'Marcus Thuram', number: 9, position: 'F', age: 27, nationality: 'France', photo: null },
    { name: 'Marko Arnautović', number: 7, position: 'F', age: 35, nationality: 'Austria', photo: null },
  ],
  'juventus': [
    { name: 'Wojciech Szczęsny', number: 1, position: 'G', age: 34, nationality: 'Poland', photo: null },
    { name: 'Mattia De Sciglio', number: 2, position: 'D', age: 31, nationality: 'Italy', photo: null },
    { name: 'Bremer', number: 3, position: 'D', age: 27, nationality: 'Brazil', photo: null },
    { name: 'Gleison Bremer', number: 19, position: 'D', age: 27, nationality: 'Brazil', photo: null },
    { name: 'Federico Gatti', number: 4, position: 'D', age: 26, nationality: 'Italy', photo: null },
    { name: 'Adrien Rabiot', number: 25, position: 'M', age: 29, nationality: 'France', photo: null },
    { name: 'Manuel Locatelli', number: 5, position: 'M', age: 27, nationality: 'Italy', photo: null },
    { name: 'Weston McKennie', number: 16, position: 'M', age: 26, nationality: 'USA', photo: null },
    { name: 'Dušan Vlahović', number: 9, position: 'F', age: 25, nationality: 'Serbia', photo: null },
    { name: 'Federico Chiesa', number: 7, position: 'F', age: 27, nationality: 'Italy', photo: null },
    { name: 'Ángel Di María', number: 11, position: 'F', age: 36, nationality: 'Argentina', photo: null },
    { name: 'Nicolò Fagioli', number: 44, position: 'M', age: 23, nationality: 'Italy', photo: null },
  ],
  'napoli': [
    { name: 'Alex Meret', number: 1, position: 'G', age: 27, nationality: 'Italy', photo: null },
    { name: 'Giovanni Di Lorenzo', number: 2, position: 'D', age: 31, nationality: 'Italy', photo: null },
    { name: 'Amir Rrahmani', number: 13, position: 'D', age: 30, nationality: 'Kosovo', photo: null },
    { name: 'Kim Min-jae', number: 3, position: 'D', age: 28, nationality: 'South Korea', photo: null },
    { name: 'Mario Rui', number: 6, position: 'D', age: 32, nationality: 'Portugal', photo: null },
    { name: 'Stanislav Lobotka', number: 22, position: 'M', age: 29, nationality: 'Slovakia', photo: null },
    { name: 'Piotr Zieliński', number: 20, position: 'M', age: 30, nationality: 'Poland', photo: null },
    { name: 'Frank Anguissa', number: 99, position: 'M', age: 29, nationality: 'Cameroon', photo: null },
    { name: 'Khvicha Kvaratskhelia', number: 77, position: 'F', age: 24, nationality: 'Georgia', photo: null },
    { name: 'Victor Osimhen', number: 9, position: 'F', age: 26, nationality: 'Nigeria', photo: null },
    { name: 'Giovanni Simeone', number: 18, position: 'F', age: 29, nationality: 'Argentina', photo: null },
    { name: 'André-Frank Zambo Anguissa', number: 99, position: 'M', age: 29, nationality: 'Cameroon', photo: null },
  ],
  'bayern-munich': [
    { name: 'Manuel Neuer', number: 1, position: 'G', age: 38, nationality: 'Germany', photo: null },
    { name: 'Dayot Upamecano', number: 5, position: 'D', age: 26, nationality: 'France', photo: null },
    { name: 'Kim Min-jae', number: 3, position: 'D', age: 28, nationality: 'South Korea', photo: null },
    { name: 'Alphonso Davies', number: 19, position: 'D', age: 24, nationality: 'Canada', photo: null },
    { name: 'Joshua Kimmich', number: 6, position: 'D', age: 29, nationality: 'Germany', photo: null },
    { name: 'Leroy Sané', number: 10, position: 'M', age: 28, nationality: 'Germany', photo: null },
    { name: 'Jamal Musiala', number: 42, position: 'M', age: 21, nationality: 'Germany', photo: null },
    { name: 'Leon Goretzka', number: 8, position: 'M', age: 29, nationality: 'Germany', photo: null },
    { name: 'Thomas Müller', number: 25, position: 'M', age: 34, nationality: 'Germany', photo: null },
    { name: 'Harry Kane', number: 9, position: 'F', age: 30, nationality: 'England', photo: null },
    { name: 'Serge Gnabry', number: 7, position: 'F', age: 28, nationality: 'Germany', photo: null },
    { name: 'Mathys Tel', number: 39, position: 'F', age: 20, nationality: 'France', photo: null },
  ],
  'borussia-dortmund': [
    { name: 'Gregor Kobel', number: 1, position: 'G', age: 27, nationality: 'Switzerland', photo: null },
    { name: 'Nico Schlotterbeck', number: 4, position: 'D', age: 25, nationality: 'Germany', photo: null },
    { name: 'Mats Hummels', number: 15, position: 'D', age: 35, nationality: 'Germany', photo: null },
    { name: 'Julian Ryerson', number: 26, position: 'D', age: 27, nationality: 'Norway', photo: null },
    { name: 'Nico Schulz', number: 14, position: 'D', age: 30, nationality: 'Germany', photo: null },
    { name: 'Felix Nmecha', number: 28, position: 'M', age: 24, nationality: 'Germany', photo: null },
    { name: 'Marcel Sabitzer', number: 18, position: 'M', age: 30, nationality: 'Austria', photo: null },
    { name: 'Jude Bellingham', number: 22, position: 'M', age: 21, nationality: 'England', photo: null },
    { name: 'Marco Reus', number: 11, position: 'M', age: 34, nationality: 'Germany', photo: null },
    { name: 'Niclas Füllkrug', number: 14, position: 'F', age: 31, nationality: 'Germany', photo: null },
    { name: 'Karim Adeyemi', number: 7, position: 'F', age: 22, nationality: 'Germany', photo: null },
    { name: 'Sébastien Haller', number: 9, position: 'F', age: 29, nationality: 'Ivory Coast', photo: null },
  ],
  'rb-leipzig': [
    { name: 'Péter Gulácsi', number: 1, position: 'G', age: 33, nationality: 'Hungary', photo: null },
    { name: 'Willi Orban', number: 4, position: 'D', age: 31, nationality: 'Hungary', photo: null },
    { name: 'Castello Lukeba', number: 32, position: 'D', age: 22, nationality: 'France', photo: null },
    { name: 'David Raum', number: 22, position: 'D', age: 26, nationality: 'Germany', photo: null },
    { name: 'Mohamed Simakan', number: 5, position: 'D', age: 24, nationality: 'France', photo: null },
    { name: 'Xavi Simons', number: 20, position: 'M', age: 21, nationality: 'Netherlands', photo: null },
    { name: 'Dani Olmo', number: 7, position: 'M', age: 26, nationality: 'Spain', photo: null },
    { name: 'Konrad Laimer', number: 44, position: 'M', age: 27, nationality: 'Austria', photo: null },
    { name: 'Loïs Openda', number: 17, position: 'F', age: 25, nationality: 'Belgium', photo: null },
    { name: 'Benjamin Šeško', number: 9, position: 'F', age: 21, nationality: 'Slovenia', photo: null },
    { name: 'Yussuf Poulsen', number: 11, position: 'F', age: 30, nationality: 'Denmark', photo: null },
    { name: 'Amadou Haidara', number: 8, position: 'M', age: 26, nationality: 'Mali', photo: null },
  ],
  'psg': [
    { name: 'Gianluigi Donnarumma', number: 1, position: 'G', age: 25, nationality: 'Italy', photo: null },
    { name: 'Achraf Hakimi', number: 2, position: 'D', age: 25, nationality: 'Morocco', photo: null },
    { name: 'Marquinhos', number: 5, position: 'D', age: 30, nationality: 'Brazil', photo: null },
    { name: 'Lucas Hernández', number: 21, position: 'D', age: 28, nationality: 'France', photo: null },
    { name: 'Nuno Mendes', number: 25, position: 'D', age: 22, nationality: 'Portugal', photo: null },
    { name: 'Warren Zaïre-Emery', number: 33, position: 'M', age: 19, nationality: 'France', photo: null },
    { name: 'Vitinha', number: 17, position: 'M', age: 24, nationality: 'Portugal', photo: null },
    { name: 'Manuel Ugarte', number: 4, position: 'M', age: 23, nationality: 'Uruguay', photo: null },
    { name: 'Ousmane Dembélé', number: 10, position: 'F', age: 27, nationality: 'France', photo: null },
    { name: 'Randal Kolo Muani', number: 9, position: 'F', age: 25, nationality: 'France', photo: null },
    { name: 'Gonçalo Ramos', number: 7, position: 'F', age: 23, nationality: 'Portugal', photo: null },
    { name: 'Bradley Barcola', number: 29, position: 'F', age: 22, nationality: 'France', photo: null },
  ],
  'marseille': [
    { name: 'Pau López', number: 16, position: 'G', age: 28, nationality: 'Spain', photo: null },
    { name: 'Jonathan Clauss', number: 2, position: 'D', age: 28, nationality: 'France', photo: null },
    { name: 'William Saliba', number: 24, position: 'D', age: 23, nationality: 'France', photo: null },
    { name: 'Chancel Mbemba', number: 5, position: 'D', age: 29, nationality: 'Congo', photo: null },
    { name: 'Lilian Brassier', number: 4, position: 'D', age: 24, nationality: 'France', photo: null },
    { name: 'Valentin Rongier', number: 19, position: 'M', age: 29, nationality: 'France', photo: null },
    { name: 'Mattéo Guendouzi', number: 6, position: 'M', age: 25, nationality: 'France', photo: null },
    { name: 'Romain Faivre', number: 8, position: 'M', age: 25, nationality: 'France', photo: null },
    { name: 'Pierre-Emerick Aubameyang', number: 10, position: 'F', age: 34, nationality: 'Gabon', photo: null },
    { name: 'Alexis Sánchez', number: 70, position: 'F', age: 35, nationality: 'Chile', photo: null },
    { name: 'Vitinha', number: 11, position: 'F', age: 23, nationality: 'Portugal', photo: null },
    { name: 'Iliman Ndiaye', number: 7, position: 'F', age: 24, nationality: 'France', photo: null },
  ],
};

// ─── Mock Recent Matches ──────────────────────────────────

function getMockRecentMatches(slug: string, teamName: string, teamLogo: string): RecentMatch[] {
  const opponents: Record<string, { name: string; logo: string }[]> = {
    'real-madrid': [
      { name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
      { name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
      { name: 'Atlético Madrid', logo: 'https://media.api-sports.io/football/teams/530.png' },
      { name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
      { name: 'Valencia', logo: 'https://media.api-sports.io/football/teams/532.png' },
      { name: ' Athletic Club', logo: 'https://media.api-sports.io/football/teams/531.png' },
    ],
    'barcelona': [
      { name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      { name: 'Atlético Madrid', logo: 'https://media.api-sports.io/football/teams/530.png' },
      { name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
      { name: 'Sevilla', logo: 'https://media.api-sports.io/football/teams/536.png' },
      { name: 'Real Betis', logo: 'https://media.api-sports.io/football/teams/534.png' },
      { name: 'Girona', logo: 'https://media.api-sports.io/football/teams/533.png' },
    ],
    'manchester-city': [
      { name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      { name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
      { name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
      { name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      { name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' },
      { name: 'Newcastle', logo: 'https://media.api-sports.io/football/teams/34.png' },
    ],
    'arsenal': [
      { name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
      { name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
      { name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
      { name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
      { name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' },
      { name: 'Aston Villa', logo: 'https://media.api-sports.io/football/teams/66.png' },
    ],
    'liverpool': [
      { name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      { name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
      { name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
      { name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
      { name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' },
      { name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
    ],
    'chelsea': [
      { name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      { name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
      { name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
      { name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' },
      { name: 'Newcastle', logo: 'https://media.api-sports.io/football/teams/34.png' },
      { name: 'Aston Villa', logo: 'https://media.api-sports.io/football/teams/66.png' },
    ],
    'ac-milan': [
      { name: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png' },
      { name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png' },
      { name: 'Napoli', logo: 'https://media.api-sports.io/football/teams/492.png' },
      { name: 'Roma', logo: 'https://media.api-sports.io/football/teams/497.png' },
      { name: 'Lazio', logo: 'https://media.api-sports.io/football/teams/487.png' },
      { name: 'Atalanta', logo: 'https://media.api-sports.io/football/teams/499.png' },
    ],
    'inter-milan': [
      { name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png' },
      { name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png' },
      { name: 'Napoli', logo: 'https://media.api-sports.io/football/teams/492.png' },
      { name: 'Roma', logo: 'https://media.api-sports.io/football/teams/497.png' },
      { name: 'Lazio', logo: 'https://media.api-sports.io/football/teams/487.png' },
      { name: 'Atalanta', logo: 'https://media.api-sports.io/football/teams/499.png' },
    ],
    'juventus': [
      { name: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png' },
      { name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png' },
      { name: 'Napoli', logo: 'https://media.api-sports.io/football/teams/492.png' },
      { name: 'Roma', logo: 'https://media.api-sports.io/football/teams/497.png' },
      { name: 'Lazio', logo: 'https://media.api-sports.io/football/teams/487.png' },
      { name: 'Atalanta', logo: 'https://media.api-sports.io/football/teams/499.png' },
    ],
    'napoli': [
      { name: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png' },
      { name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png' },
      { name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png' },
      { name: 'Roma', logo: 'https://media.api-sports.io/football/teams/497.png' },
      { name: 'Lazio', logo: 'https://media.api-sports.io/football/teams/487.png' },
      { name: 'Atalanta', logo: 'https://media.api-sports.io/football/teams/499.png' },
    ],
    'bayern-munich': [
      { name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png' },
      { name: 'RB Leipzig', logo: 'https://media.api-sports.io/football/teams/173.png' },
      { name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      { name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      { name: 'Bayer Leverkusen', logo: 'https://media.api-sports.io/football/teams/168.png' },
      { name: 'Wolfsburg', logo: 'https://media.api-sports.io/football/teams/161.png' },
    ],
    'borussia-dortmund': [
      { name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
      { name: 'RB Leipzig', logo: 'https://media.api-sports.io/football/teams/173.png' },
      { name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      { name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      { name: 'Bayer Leverkusen', logo: 'https://media.api-sports.io/football/teams/168.png' },
      { name: 'Wolfsburg', logo: 'https://media.api-sports.io/football/teams/161.png' },
    ],
    'rb-leipzig': [
      { name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
      { name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png' },
      { name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      { name: 'Bayer Leverkusen', logo: 'https://media.api-sports.io/football/teams/168.png' },
      { name: 'Wolfsburg', logo: 'https://media.api-sports.io/football/teams/161.png' },
      { name: 'Union Berlin', logo: 'https://media.api-sports.io/football/teams/182.png' },
    ],
    'psg': [
      { name: 'Marseille', logo: 'https://media.api-sports.io/football/teams/81.png' },
      { name: 'Monaco', logo: 'https://media.api-sports.io/football/teams/91.png' },
      { name: 'Lyon', logo: 'https://media.api-sports.io/football/teams/80.png' },
      { name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      { name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
      { name: 'Nice', logo: 'https://media.api-sports.io/football/teams/84.png' },
    ],
    'marseille': [
      { name: 'PSG', logo: 'https://media.api-sports.io/football/teams/85.png' },
      { name: 'Monaco', logo: 'https://media.api-sports.io/football/teams/91.png' },
      { name: 'Lyon', logo: 'https://media.api-sports.io/football/teams/80.png' },
      { name: 'Nice', logo: 'https://media.api-sports.io/football/teams/84.png' },
      { name: 'Lille', logo: 'https://media.api-sports.io/football/teams/79.png' },
      { name: 'Rennes', logo: 'https://media.api-sports.io/football/teams/82.png' },
    ],
  };

  const configs = TEAMS[slug];
  const opps = opponents[slug] || opponents['real-madrid']!;
  const now = Date.now();

  return opps.map((opp, i) => {
    const isHome = i % 2 === 0;
    const hScore = Math.floor(Math.random() * 4);
    const aScore = Math.floor(Math.random() * 3);
    const date = new Date(now - (i + 1) * 7 * 86400000).toISOString().split('T')[0];
    return {
      id: `mock-${slug}-match-${i}`,
      homeTeam: isHome ? teamName : opp.name,
      awayTeam: isHome ? opp.name : teamName,
      homeScore: isHome ? hScore : aScore,
      awayScore: isHome ? aScore : hScore,
      date,
      status: 'finished',
      league: configs?.league || 'Unknown League',
      homeLogo: isHome ? teamLogo : opp.logo,
      awayLogo: isHome ? opp.logo : teamLogo,
      isHome,
    };
  });
}

// ─── Mock Stats ────────────────────────────────────────────

function getMockStats(slug: string): TeamStats {
  const stats: Record<string, TeamStats> = {
    'real-madrid':      { standing: 1, played: 30, won: 22, drawn: 5, lost: 3, goalsFor: 68, goalsAgainst: 24, points: 71, form: ['W','W','D','W','L'] },
    'barcelona':        { standing: 2, played: 30, won: 21, drawn: 6, lost: 3, goalsFor: 72, goalsAgainst: 30, points: 69, form: ['W','D','W','W','W'] },
    'manchester-city':  { standing: 3, played: 29, won: 20, drawn: 4, lost: 5, goalsFor: 65, goalsAgainst: 28, points: 64, form: ['L','W','W','D','W'] },
    'arsenal':          { standing: 4, played: 30, won: 19, drawn: 6, lost: 5, goalsFor: 60, goalsAgainst: 25, points: 63, form: ['W','L','W','W','D'] },
    'liverpool':        { standing: 1, played: 29, won: 22, drawn: 4, lost: 3, goalsFor: 70, goalsAgainst: 26, points: 70, form: ['W','W','W','L','W'] },
    'chelsea':          { standing: 6, played: 30, won: 16, drawn: 5, lost: 9, goalsFor: 52, goalsAgainst: 35, points: 53, form: ['D','W','L','W','W'] },
    'ac-milan':         { standing: 5, played: 30, won: 16, drawn: 8, lost: 6, goalsFor: 52, goalsAgainst: 32, points: 56, form: ['W','D','L','W','W'] },
    'inter-milan':      { standing: 1, played: 30, won: 24, drawn: 4, lost: 2, goalsFor: 72, goalsAgainst: 20, points: 76, form: ['W','W','W','D','W'] },
    'juventus':         { standing: 4, played: 30, won: 15, drawn: 10, lost: 5, goalsFor: 48, goalsAgainst: 28, points: 55, form: ['D','W','D','W','L'] },
    'napoli':           { standing: 2, played: 30, won: 20, drawn: 6, lost: 4, goalsFor: 60, goalsAgainst: 26, points: 66, form: ['W','W','L','W','D'] },
    'bayern-munich':    { standing: 1, played: 28, won: 21, drawn: 4, lost: 3, goalsFor: 75, goalsAgainst: 25, points: 67, form: ['W','W','W','D','W'] },
    'borussia-dortmund':{ standing: 3, played: 28, won: 16, drawn: 4, lost: 8, goalsFor: 58, goalsAgainst: 38, points: 52, form: ['W','L','W','W','L'] },
    'rb-leipzig':       { standing: 5, played: 28, won: 14, drawn: 5, lost: 9, goalsFor: 50, goalsAgainst: 36, points: 47, form: ['L','W','D','W','L'] },
    'psg':              { standing: 1, played: 28, won: 22, drawn: 4, lost: 2, goalsFor: 68, goalsAgainst: 22, points: 70, form: ['W','W','D','W','W'] },
    'marseille':        { standing: 3, played: 28, won: 15, drawn: 7, lost: 6, goalsFor: 50, goalsAgainst: 30, points: 52, form: ['D','W','L','W','W'] },
  };
  return stats[slug] || { standing: 8, played: 28, won: 12, drawn: 6, lost: 10, goalsFor: 42, goalsAgainst: 36, points: 42, form: ['W','D','L','W','D'] };
}

// ─── Mock Lineup (CSS Grid positions for pitch view) ──────

function getMockLineup(slug: string, squad: SquadPlayer[]): LineupPlayer[] {
  const formation = TEAMS[slug]?.formation || '4-3-3';
  const parts = formation.split('-').map(Number);

  // Grid positions (percentage-based on a 11x11 grid)
  const gkPos: LineupPlayer = { name: squad.find(p => p.position === 'G')?.name || 'GK', number: squad.find(p => p.position === 'G')?.number || 1, position: 'G', photo: null, gridX: '5', gridY: '5' };

  // Defenders
  const defs = squad.filter(p => p.position === 'D').slice(0, parts[0]);
  const defSpread = 90 / (parts[0] + 1);
  const defsLineup: LineupPlayer[] = defs.map((d, i) => ({
    name: d.name, number: d.number, position: 'D', photo: null,
    gridX: String(10 + (i + 1) * defSpread),
    gridY: '25',
  }));

  // Midfielders
  const mids = squad.filter(p => p.position === 'M').slice(0, parts[1]);
  const midSpread = 90 / (parts[1] + 1);
  const midsLineup: LineupPlayer[] = mids.map((m, i) => ({
    name: m.name, number: m.number, position: 'M', photo: null,
    gridX: String(10 + (i + 1) * midSpread),
    gridY: '50',
  }));

  // Forwards
  const fwds = squad.filter(p => p.position === 'F').slice(0, parts[2] || 2);
  const fwdSpread = 90 / (fwds.length + 1);
  const fwdsLineup: LineupPlayer[] = fwds.map((f, i) => ({
    name: f.name, number: f.number, position: 'F', photo: null,
    gridX: String(10 + (i + 1) * fwdSpread),
    gridY: '78',
  }));

  return [gkPos, ...defsLineup, ...midsLineup, ...fwdsLineup];
}

// ─── Resolve Slug ──────────────────────────────────────────

function resolveSlug(slug: string): { config: TeamConfig; teamName: string } | null {
  const config = TEAMS[slug];
  if (config) return { config, teamName: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') };

  // Try partial match
  const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, '-');
  for (const [key, cfg] of Object.entries(TEAMS)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      const teamName = key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { config: cfg, teamName };
    }
  }
  return null;
}

// ─── GET /api/teams/[slug] ────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const resolved = resolveSlug(slug);
  if (!resolved) {
    return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
  }

  const { config, teamName } = resolved;
  const logo = `https://media.api-sports.io/football/teams/${config.apiId}.png`;
  const teamInfo: TeamInfo = {
    id: slug,
    name: teamName,
    slug,
    logo,
    country: config.country,
    founded: config.founded,
    venue: config.venue,
    venueCapacity: config.venueCapacity,
    league: config.league,
  };

  // Try API-Football
  if (API_KEY) {
    try {
      const headers = { 'x-apisports-key': API_KEY };

      // Fetch team info
      const teamRes = await fetch(`${API_BASE}/teams?id=${config.apiId}`, { headers, next: { revalidate: 300 } });
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData.response?.[0]) {
          const t = teamData.response[0];
          teamInfo.name = t.team.name;
          teamInfo.logo = t.team.logo;
          teamInfo.country = t.team.country;
          teamInfo.founded = t.team.founded;
          teamInfo.venue = t.venue.name;
          teamInfo.venueCapacity = t.venue.capacity;
        }
      }

      // Fetch squad
      let squad: SquadPlayer[] = [];
      const squadRes = await fetch(`${API_BASE}/players/squads?team=${config.apiId}`, { headers, next: { revalidate: 300 } });
      if (squadRes.ok) {
        const squadData = await squadRes.json();
        if (Array.isArray(squadData.response?.[0]?.players)) {
          squad = squadData.response[0].players.map((p: any) => ({
            name: p.name,
            number: p.number ?? null,
            position: p.position === 'Goalkeeper' ? 'G' : p.position === 'Defender' ? 'D' : p.position === 'Midfielder' ? 'M' : 'F',
            age: p.age ?? 0,
            nationality: p.nationality || '',
            photo: p.photo || null,
          }));
        }
      }

      // Fetch recent matches
      let recentMatches: RecentMatch[] = [];
      const matchRes = await fetch(`${API_BASE}/fixtures?team=${config.apiId}&last=8`, { headers, next: { revalidate: 300 } });
      if (matchRes.ok) {
        const matchData = await matchRes.json();
        if (Array.isArray(matchData.response)) {
          recentMatches = matchData.response.map((m: any) => ({
            id: String(m.fixture.id),
            homeTeam: m.teams.home.name,
            awayTeam: m.teams.away.name,
            homeScore: m.goals.home,
            awayScore: m.goals.away,
            date: m.fixture.date.split('T')[0],
            status: m.fixture.status.short === 'FT' ? 'finished' : m.fixture.status.short.toLowerCase(),
            league: m.league.name,
            homeLogo: m.teams.home.logo,
            awayLogo: m.teams.away.logo,
            isHome: m.teams.home.id === config.apiId,
          }));
        }
      }

      // Fetch stats
      let stats: TeamStats = { standing: null, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: [] };
      const statsRes = await fetch(`${API_BASE}/teams/statistics?league=${config.leagueId}&season=2024&team=${config.apiId}`, { headers, next: { revalidate: 300 } });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const s = statsData.response;
        if (s) {
          stats = {
            standing: s.standings?.[0] ? parseInt(s.standings[0]) : null,
            played: s.fixtures?.played?.total || 0,
            won: s.fixtures?.wins?.total || 0,
            drawn: s.fixtures?.draws?.total || 0,
            lost: s.fixtures?.loses?.total || 0,
            goalsFor: s.goals?.for?.total?.total || 0,
            goalsAgainst: s.goals?.against?.total?.total || 0,
            points: (s.fixtures?.wins?.total || 0) * 3 + (s.fixtures?.draws?.total || 0),
            form: (s.form || '').split('').slice(0, 5).filter((c: string) => c === 'W' || c === 'D' || c === 'L').map((c: string) => c as 'W' | 'D' | 'L'),
          };
        }
      }

      // Use mock data when API returns empty
      const mockSquad = MOCK_SQUADS[slug] || [];
      const mockMatches = getMockRecentMatches(slug, teamName, logo);
      const mockStats = getMockStats(slug);
      const finalSquad = squad.length > 0 ? squad : mockSquad;
      const finalMatches = recentMatches.length > 0 ? recentMatches : mockMatches;
      const finalStats = stats.played > 0 ? stats : mockStats;
      const finalLineup = getMockLineup(slug, finalSquad);
      const source = (squad.length > 0 && recentMatches.length > 0 && stats.played > 0) ? 'api-football' : 'mock';

      return NextResponse.json({
        success: true,
        team: teamInfo,
        stats: finalStats,
        squad: finalSquad,
        recentMatches: finalMatches,
        lineup: finalLineup,
        formation: config.formation,
        colors: config.colors,
        source,
      });
    } catch (error: any) {
      console.error('[teams API Error]', error.message);
      // Fall through to mock
    }
  }

  // ─── Mock Fallback ───────────────────────────────────────
  const squad = MOCK_SQUADS[slug] || [];
  const recentMatches = getMockRecentMatches(slug, teamName, logo);
  const stats = getMockStats(slug);
  const lineup = getMockLineup(slug, squad);

  return NextResponse.json({
    success: true,
    team: teamInfo,
    stats,
    squad,
    recentMatches,
    lineup,
    formation: config.formation,
    colors: config.colors,
    source: 'mock',
  });
}
