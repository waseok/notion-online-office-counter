import { redirect } from "next/navigation";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readDailyStats, readStats } from "@/lib/counter-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const [stats, daily] = await Promise.all([readStats(), readDailyStats()]);
  const visibleDaily = daily.slice(0, 31);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">ONLINE OFFICE</p>
          <h1>접속 통계 관리</h1>
        </div>
        <div className="admin-actions">
          <a className="admin-export" href="/api/admin/export">Excel용 CSV 내려받기</a>
          <form action="/api/admin/logout" method="post"><button type="submit" className="admin-logout">로그아웃</button></form>
        </div>
      </header>

      <section className="admin-metrics" aria-label="요약 통계">
        {[
          ["오늘", stats.today],
          ["이번 주", stats.week],
          ["이번 달", stats.month],
          ["누적", stats.total],
        ].map(([label, value]) => (
          <article className="admin-metric-card" key={String(label)}>
            <span>{label}</span>
            <strong>{Number(value).toLocaleString("ko-KR")}</strong>
            <small>회</small>
          </article>
        ))}
      </section>

      <section className="admin-table-card">
        <div className="admin-table-heading">
          <div><h2>일별 접속 기록</h2><p>최근 31일을 보여줍니다. 전체 기록은 Excel용 CSV에서 확인할 수 있습니다.</p></div>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead><tr><th>날짜</th><th>접속 수</th></tr></thead>
            <tbody>
              {visibleDaily.length ? visibleDaily.map((item) => <tr key={item.date}><td>{item.date}</td><td>{item.views.toLocaleString("ko-KR")}회</td></tr>) : <tr><td colSpan={2} className="admin-empty">아직 기록된 접속 데이터가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
