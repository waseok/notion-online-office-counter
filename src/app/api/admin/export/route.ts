import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readDailyStats, readStats } from "@/lib/counter-service";

export const dynamic = "force-dynamic";

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const [summary, daily] = await Promise.all([readStats(), readDailyStats()]);
    const rows = [
      ["온라인 교무실 접속 통계"],
      ["내보낸 시각 (KST)", new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "medium" }).format(new Date())],
      [],
      ["요약", "접속 수"],
      ["오늘", summary.today],
      ["이번 주", summary.week],
      ["이번 달", summary.month],
      ["누적", summary.total],
      [],
      ["날짜", "접속 수"],
      ...daily.map((item) => [item.date, item.views]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="online-office-counter-statistics.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Admin CSV export failed", error);
    return NextResponse.json({ error: "통계 파일을 만들지 못했습니다." }, { status: 503 });
  }
}
