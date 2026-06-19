import { NextResponse } from "next/server";

import { getIsAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const isAdmin = await getIsAdmin();

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const response = await fetch(
    "https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId=475&year=2024",
    {
      headers: {
        "x-rapidapi-host": "live-golf-data.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  return NextResponse.json(data);
}