import { NextResponse } from "next/server";
import { getCurrentMatch } from "@/lib/match-state";
import { finalizeActiveMatch, cancelMatchEndTimer } from "@/lib/match-timer";

/**
 * POST /api/end-match
 *
 * Ends the current match early (or finalizes it) and returns final results.
 * This is server-only, protected by SERVER_TOKEN.
 *
 * Designed so that in the future we can persist a full "match record"
 * (including events and final scores) to a database.
 */
export async function POST(req: Request) {
  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { serverToken } = data;

  // Validate server token
  if (serverToken !== process.env.SERVER_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Check if there's an existing active match
  const match = getCurrentMatch();
  if (!match) {
    return NextResponse.json(
      { error: "No match active." },
      { status: 404 }
    );
  }

  if (match.status === "ended") {
    return NextResponse.json(
      { error: "The current match has already ended." },
      { status: 410 }
    );
  }

  if (match.status === "waiting") {
    return NextResponse.json(
      { error: "The current match has not yet started." },
      { status: 409 }
    );
  }

  // Match is active: end it now.
  cancelMatchEndTimer();

  const { endedAt, results } = finalizeActiveMatch(match);

  return NextResponse.json({
    success: true,
    match: {
      ...match,
      status: "ended",
      endedAt,
    },
    results,
  });
}
