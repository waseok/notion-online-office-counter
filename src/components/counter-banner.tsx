"use client";

import { useEffect, useState } from "react";

import type { CounterStats } from "@/types/counter";

const EMPTY_STATS: CounterStats = { today: 0, week: 0, month: 0, total: 0 };
const NUMBER_FORMATTER = new Intl.NumberFormat("ko-KR");

type MetricProps = {
  fullLabel: string;
  shortLabel: string;
  value: number | null;
};

function Metric({ fullLabel, shortLabel, value }: MetricProps) {
  return (
    <span className="counter-metric">
      <span className="metric-label-full">{fullLabel}</span>
      <span className="metric-label-short">{shortLabel}</span>
      <span className="counter-value">
        {value === null ? "–" : NUMBER_FORMATTER.format(value)}회
      </span>
    </span>
  );
}

export function CounterBanner() {
  const [requestId] = useState(() => crypto.randomUUID());
  const [stats, setStats] = useState<CounterStats>(EMPTY_STATS);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    async function load(attempt = 0): Promise<void> {
      try {
        const response = await fetch("/api/view", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId }),
        });

        if (!response.ok) throw new Error("Counter request failed");
        const nextStats = (await response.json()) as CounterStats;
        if (active) {
          setStats(nextStats);
          setStatus("ready");
        }
      } catch {
        if (attempt < 2) {
          window.setTimeout(() => void load(attempt + 1), 500 * (attempt + 1));
        } else if (active) {
          setStatus("error");
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [requestId]);

  const values = status === "loading" ? null : stats;

  return (
    <main className="counter-banner" aria-live="polite" aria-busy={status === "loading"}>
      <span className="counter-title">온라인 교무실 이용현황</span>
      <span className="counter-divider" aria-hidden="true" />
      {status === "error" ? (
        <span className="counter-error">통계를 불러오지 못했습니다.</span>
      ) : (
        <span className="counter-metrics">
          <Metric fullLabel="오늘" shortLabel="오늘" value={values?.today ?? null} />
          <Metric fullLabel="이번 주" shortLabel="주" value={values?.week ?? null} />
          <Metric fullLabel="이번 달" shortLabel="월" value={values?.month ?? null} />
          <Metric fullLabel="누적" shortLabel="누적" value={values?.total ?? null} />
        </span>
      )}
    </main>
  );
}
