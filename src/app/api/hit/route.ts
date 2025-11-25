import { NextResponse } from "next/server";

export async function POST(req: Request) {
/*  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }*/
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
