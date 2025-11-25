import { NextResponse } from "next/server";
import { getCurrentMatch, registerPlane, setPlaneAuthToken } from "@/lib/match-state";
import { generateAuthToken } from "@/lib/utils";

export async function POST(req: Request) {
    let data;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { planeId, esp32Ip, userId } = data;

    if (!planeId || !esp32Ip || !userId) {
        return NextResponse.json(
            { error: "Missing required fields: planeId, esp32Ip, and userId are required." },
            { status: 400 }
        );
    }

    // Check if a match exists
    const match = getCurrentMatch();
    if (!match || match.status === "ended") {
        return NextResponse.json(
            { error: "No active match found to register to." },
            { status: 404 }
        );
    }

    // Generate a new auth token for this session
    const authToken = generateAuthToken();

    // Register the plane in the current match state
    // We store the authToken in memory associated with this planeId for this match
    // For now, we will just store basic info in the match state
    const success = registerPlane(match.matchId, {
        planeId,
        esp32Ip,
        userId,
        registeredAt: new Date(),
    });

    if (!success) {
        return NextResponse.json(
            { error: "Failed to register plane. Match may have ended." },
            { status: 500 }
        );
    }

    // Store the auth token securely on the server, mapped to matchId + planeId
    setPlaneAuthToken(match.matchId, planeId, authToken);

    return NextResponse.json({
        success: true,
        authToken: authToken,
        matchId: match.matchId,
    });
}
