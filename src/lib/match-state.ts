import { MatchState, RegisteredPlane } from "@/types";

let currentMatch: MatchState | null = null;

// In-memory auth token store, scoped by matchId + planeId
const planeAuthTokens = new Map<string, string>();

// Return current match state
export function getCurrentMatch() {
  return currentMatch;
}

// Update match state
export function updateCurrentMatch(
  updater: (match: MatchState | null) => MatchState | null
): MatchState | null {
  const previousMatch = currentMatch;
  currentMatch = updater(currentMatch);

  // If match ended or a new match started, clear all stored auth tokens
  if (
    (!currentMatch && previousMatch) ||
    (currentMatch && previousMatch && currentMatch.matchId !== previousMatch.matchId)
  ) {
    planeAuthTokens.clear();
  }

  return currentMatch;
}

export function registerPlane(matchId: string, planeData: RegisteredPlane): boolean {
  if (!currentMatch || currentMatch.matchId !== matchId)
    return false;
  
  // Check if plane already registered, if so update it
  const existingIndex = currentMatch.registeredPlanes.findIndex(p => p.planeId === planeData.planeId);
  
  if (existingIndex >= 0) {
    currentMatch.registeredPlanes[existingIndex] = {
      ...currentMatch.registeredPlanes[existingIndex],
      ...planeData
    };
  } else {
    currentMatch.registeredPlanes.push(planeData);
  }
  
  return true;
}

// Store/overwrite the auth token for a given plane in a given match
export function setPlaneAuthToken(matchId: string, planeId: string, authToken: string): void {
  const key = `${matchId}:${planeId}`;
  planeAuthTokens.set(key, authToken);
}

// Validate that the provided auth token matches what we stored
export function validatePlaneAuthToken(
  matchId: string,
  planeId: string,
  authToken: string
): boolean {
  const key = `${matchId}:${planeId}`;
  return planeAuthTokens.get(key) === authToken;
}

export function joinPlaneToMatch(gamePin: string, planeId: string, playerName: string): boolean {
  if (!currentMatch || currentMatch.gamePin !== gamePin) return false;

  const planeIndex = currentMatch.registeredPlanes.findIndex(
    (p) => p.planeId === planeId
  );

  // Plane must be registered first (via /api/register)
  if (planeIndex === -1) return false;

  currentMatch.registeredPlanes[planeIndex].playerName = playerName;

  // Trigger WebSocket update here in the future

  return true;
}
