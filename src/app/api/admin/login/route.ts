import { NextResponse } from "next/server";

import { adminSessionCookie, isCorrectAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password !== "string" || !isCorrectAdminPassword(body.password)) {
      return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    const session = adminSessionCookie();
    response.cookies.set(session.name, session.value, session.options);
    return response;
  } catch (error) {
    console.error("Admin login failed", error);
    return NextResponse.json({ error: "관리자 로그인을 처리하지 못했습니다." }, { status: 503 });
  }
}
