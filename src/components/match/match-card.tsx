"use client";

import { Match, MatchStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface MatchCardProps {
  match: Match;
  onClick: (match: Match) => void;
}

function getStatusConfig(status: MatchStatus) {
  switch (status) {
    case "live":
      return {
        label: "LIVE",
        variant: "destructive" as const,
        className: "bg-red-600 text-white animate-pulse",
      };
    case "finished":
      return {
        label: "FT",
        variant: "secondary" as const,
        className: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
      };
    case "upcoming":
      return {
        label: "UPCOMING",
        variant: "outline" as const,
        className: "bg-amber-600/20 text-amber-400 border-amber-600/30",
      };
  }
}

export function MatchCard({ match, onClick }: MatchCardProps) {
  const statusConfig = getStatusConfig(match.status);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className="cursor-pointer overflow-hidden border-border/50 bg-card/80 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10"
        onClick={() => onClick(match)}
      >
        <CardContent className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {match.competition} • MD {match.matchDay}
            </span>
            <Badge className={`text-[10px] font-bold uppercase ${statusConfig.className}`}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Score Section */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Home Team */}
            <div className="flex flex-1 items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">{match.homeTeam.teamLogo}</span>
              <span className="truncate text-sm font-semibold text-foreground sm:text-base">
                {match.homeTeam.teamName}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 sm:gap-3">
              {match.status === "upcoming" ? (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">{match.time}</span>
                </div>
              ) : (
                <>
                  <span className="min-w-[28px] text-center text-2xl font-bold text-foreground sm:text-3xl">
                    {match.score.home}
                  </span>
                  <span className="text-lg text-muted-foreground">-</span>
                  <span className="min-w-[28px] text-center text-2xl font-bold text-foreground sm:text-3xl">
                    {match.score.away}
                  </span>
                </>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
              <span className="truncate text-right text-sm font-semibold text-foreground sm:text-base">
                {match.awayTeam.teamName}
              </span>
              <span className="text-2xl sm:text-3xl">{match.awayTeam.teamLogo}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {match.venue}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {match.date} • {match.time}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
