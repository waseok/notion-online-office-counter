import { NextResponse } from "next/server";

import { recordView } from "@/lib/counter-service";

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { requestId?: unknown };
    if (typeof body.requestId !== "string" || !UUID_PATTERN.test(body.requestId)) {
      return NextResponse.json(
        { error: "올바르지 않은 요청입니다." },
        { status: 400 },
      );
    }

    const stats = await recordView(body.requestId);
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Failed to record counter view", error);
    return NextResponse.json(
      { error: "통계를 불러오지 못했습니다." },
      { status: 503 },
    );
  }
}
