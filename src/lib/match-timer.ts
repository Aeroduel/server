import type { MatchState, Plane } from "@/types";
import { getCurrentMatch, getJoinedPlanes, updateCurrentMatch } from "@/lib/match-state";
import { broadcastMatchEnd } from "@/lib/websocket";

interface MatchScore {
  planeId: string;
  playerName?: string;
  hits: number;
  hitsTaken: number;
  isDisqualified: boolean;
  isWinner: boolean;
}

interface MatchEndResults {
  endedAt: Date;
  results: {
    winners: string[];
    scores: MatchScore[];
  };
  matchBefore: MatchState;
}

// Single in-memory timer for the current match
let matchEndTimer: NodeJS.Timeout | null = null;

/**
 * Schedule a timer to automatically end the current match after the given duration.
 * Returns the Date when the match is expected to end.
 */
export function scheduleMatchEndTimer(
  matchId: string,
  durationSeconds: number,
): Date {
  // Clear any existing timer
  if (matchEndTimer) {
    clearTimeout(matchEndTimer);
    matchEndTimer = null;
  }

  const delayMs = durationSeconds * 1000;
  const endsAt = new Date(Date.now() + delayMs);

  matchEndTimer = setTimeout(() => {
    const match = getCurrentMatch();
    if (!match) return;

    // If match has changed or is no longer active, do nothing.
    if (match.matchId !== matchId || match.status !== "active") return;

    try {
      finalizeActiveMatch(match);
    } catch (err) {
      console.error("[match-timer] Error auto-ending match:", err);
    }
  }, delayMs);

  return endsAt;
}

/**
 * Cancel any pending auto-end timer for the current match.
 */
export function cancelMatchEndTimer(): void {
  if (matchEndTimer) {
    clearTimeout(matchEndTimer);
    matchEndTimer = null;
  }
}

/**
 * Core "end match" logic, used both by the manual /api/end-match endpoint
 * and by the automatic match timer.
 *
 * Assumes the given match is the current active match.
 */
export function finalizeActiveMatch(match: MatchState): MatchEndResults {
  // Safety checks
  const current = getCurrentMatch();
  if (!current || current.matchId !== match.matchId || current.status !== "active") {
    throw new Error("Cannot finalize match: current match is not the expected active match.");
  }

  // Once we are finalizing, ensure any timer won't run a second time.
  cancelMatchEndTimer();

  // Compute scores for all planes that joined this match
  const joinedPlanes: Plane[] = getJoinedPlanes();

  const scoredPlanes: MatchScore[] = joinedPlanes.map((plane) => ({
    planeId: plane.planeId,
    playerName: plane.playerName,
    hits: plane.hits ?? 0,
    hitsTaken: plane.hitsTaken ?? 0,
    isDisqualified: plane.isDisqualified ?? false,
    isWinner: false, // filled in below
  }));

  // Sort by hits desc, then hitsTaken asc, per scoring rules
  scoredPlanes.sort((a, b) => {
    if (b.hits !== a.hits) return b.hits - a.hits;
    if (a.hitsTaken !== b.hitsTaken) return a.hitsTaken - b.hitsTaken;
    return 0;
  });

  // Determine winners according to tie rules
  if (scoredPlanes.length > 0) {
    const top = scoredPlanes[0];
    const topHits = top.hits;
    const topHitsTaken = top.hitsTaken;

    // All planes matching top hits and top hitsTaken share first place (draw)
    for (const s of scoredPlanes) {
      if (s.hits === topHits && s.hitsTaken === topHitsTaken) {
        s.isWinner = true;
      }
    }
  }

  const endedAt = new Date();

  const resultsPayload = {
    winners: scoredPlanes.filter((p) => p.isWinner).map((p) => p.planeId),
    scores: scoredPlanes,
  };

  // Update in-memory match state to mark it as ended
  updateCurrentMatch((currentMatch) => {
    if (!currentMatch || currentMatch.matchId !== match.matchId) {
      return currentMatch;
    }

    return {
      ...currentMatch,
      status: "ended",
      // We don't store endedAt on MatchState yet, but callers can include it in responses
      events: currentMatch.events ?? [],
    };
  });

  // Notify clients about final scores
  broadcastMatchEnd(resultsPayload);

  return {
    endedAt,
    results: resultsPayload,
    matchBefore: match,
  };
}