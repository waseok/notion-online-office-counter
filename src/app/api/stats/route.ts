import { NextResponse } from "next/server";

import { readStats } from "@/lib/counter-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await readStats();
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Failed to read counter stats", error);
    return NextResponse.json(
      { error: "통계를 불러오지 못했습니다." },
      { status: 503 },
    );
  }
}
