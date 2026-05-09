export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD";

export interface Player {
  id: string;
  name: string;
  number: number;
  position: PlayerPosition;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

export interface TeamLineup {
  teamName: string;
  teamLogo: string;
  teamColor: string;
  formation: string;
  players: Player[];
  substitutes: Player[];
}

export type MatchEventType = "goal" | "yellow_card" | "red_card" | "substitution";

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  minute: number;
  player: string;
  team: "home" | "away";
  assistBy?: string;
  playerOut?: string;
}

export type MatchStatus = "upcoming" | "live" | "finished";

export interface MatchScore {
  home: number;
  away: number;
}

export interface Match {
  id: string;
  competition: string;
  date: string;
  time: string;
  status: MatchStatus;
  homeTeam: TeamLineup;
  awayTeam: TeamLineup;
  score: MatchScore;
  venue: string;
  events: MatchEvent[];
  matchDay: number;
}
