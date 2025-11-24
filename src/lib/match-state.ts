import { MatchState, RegisteredPlane } from "@/types";

let currentMatch: MatchState | null = null;

// Return current match state
export function getCurrentMatch() {
  return currentMatch;
}

// Update match state
export function updateCurrentMatch(updater: (match: MatchState | null) => MatchState | null): MatchState | null {
  currentMatch = updater(currentMatch);
  return currentMatch;
}

export function registerPlane(matchId: string, planeData: RegisteredPlane): boolean {
  if (!currentMatch || currentMatch.matchId !== matchId) return false;
  
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

export function joinPlaneToMatch(gamePin: string, planeId: string, playerName: string): boolean {
  if (!currentMatch || currentMatch.gamePin !== gamePin) return false;

  const planeIndex = currentMatch.registeredPlanes.findIndex(p => p.planeId === planeId);
  
  // Plane must be registered first (via /api/register)
  if (planeIndex === -1) return false;

  currentMatch.registeredPlanes[planeIndex].playerName = playerName;
  
  // Trigger WebSocket update here in the future
  
  return true;
}
