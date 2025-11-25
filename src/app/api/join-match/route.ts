import { NextResponse } from "next/server";
import { getCurrentMatch, joinPlaneToMatch, validatePlaneAuthToken } from "@/lib/match-state";

export async function POST(req: Request) {
    let data;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { authToken, gamePin, planeId, playerName } = data;

    if (!authToken || !gamePin || !planeId || !playerName) {
        return NextResponse.json(
            { error: "Missing required fields: authToken, gamePin, planeId, and playerName." },
            { status: 400 }
        );
    }

    // Validate Game PIN
    const match = getCurrentMatch();
    if (!match || match.gamePin !== gamePin) {
        return NextResponse.json(
            { error: "Invalid Game PIN or no match active." },
            { status: 404 }
        );
    }

    if (match.status !== "waiting") {
        return NextResponse.json(
            { error: "Match is already in progress or ended." },
            { status: 409 }
        );
    }

    // Check max players
    const currentPlayers = match.registeredPlanes.filter(p => p.playerName).length;
    if (currentPlayers >= match.maxPlayers) {
        return NextResponse.json(
            { error: "Match is full." },
            { status: 409 }
        );
    }

    // Validate authToken against the one generated in /api/register
    const isValidToken = validatePlaneAuthToken(match.matchId, planeId, authToken);
    if (!isValidToken) {
        return NextResponse.json(
            { error: "Invalid auth token for this plane." },
            { status: 401 }
        );
    }

    const success = joinPlaneToMatch(gamePin, planeId, playerName);

    if (!success) {
        return NextResponse.json(
            { error: "Plane not registered. Please ensure the plane is turned on and connected to WiFi first." },
            { status: 400 }
        );
    }

    return NextResponse.json({
        success: true
    });
}
