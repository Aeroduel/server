import { NextResponse } from "next/server";
import { getCurrentMatch, registerPlane } from "@/lib/match-state";
import { generateAuthToken } from "@/lib/utils";

export async function POST(req: Request) {
    let data;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { planeId, esp32Ip, userId } = data;

    if (!planeId || !esp32Ip) {
        return NextResponse.json(
            { error: "Missing required fields: planeId and esp32Ip are required." },
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
        registeredAt: new Date(),
        // In a real implementation, we would store the authToken securely mapped to the planeId
        // For this implementation, we assume the client manages it
    });

    if (!success) {
        return NextResponse.json(
            { error: "Failed to register plane. Match may have ended." },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        authToken: authToken,
        matchId: match.matchId
    });
}
