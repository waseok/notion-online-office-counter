import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { CounterRpcStats, CounterStats } from "@/types/counter";

const DEFAULT_PAGE_KEY = "online-office-main";

// Notion analytics snapshot captured on 2026-07-23.
// The live counter had 29 weekly/monthly/total views at the same time, so only
// the difference is added. Weekly and monthly offsets expire with the period.
const NOTION_ANALYTICS_BASELINE = {
  weekOffset: 222 - 29,
  weekEnd: "2026-07-26",
  monthOffset: 1017 - 29,
  monthEnd: "2026-07-31",
  totalOffset: 20385 - 29,
} as const;

export type DailyCounterStat = {
  date: string;
  views: number;
};

type DailyCounterRpcRow = {
  view_date: string;
  view_count: number | string;
};

function initialTotal(): number {
  const parsed = Number.parseInt(process.env.COUNTER_INITIAL_TOTAL ?? "0", 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function koreanDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function applyNotionBaseline(stats: CounterStats): CounterStats {
  const current = koreanDate();

  return {
    today: stats.today,
    week:
      stats.week +
      (current <= NOTION_ANALYTICS_BASELINE.weekEnd
        ? NOTION_ANALYTICS_BASELINE.weekOffset
        : 0),
    month:
      stats.month +
      (current <= NOTION_ANALYTICS_BASELINE.monthEnd
        ? NOTION_ANALYTICS_BASELINE.monthOffset
        : 0),
    total:
      stats.total + NOTION_ANALYTICS_BASELINE.totalOffset + initialTotal(),
  };
}

function normalizeStats(data: unknown): CounterStats {
  const stats = data as CounterRpcStats | null;
  if (!stats) throw new Error("Counter stats were empty.");

  const normalized: CounterStats = {
    today: Number(stats.today),
    week: Number(stats.week),
    month: Number(stats.month),
    total: Number(stats.total),
  };

  if (Object.values(normalized).some((value) => !Number.isSafeInteger(value))) {
    throw new Error("Counter stats contained an invalid number.");
  }

  return applyNotionBaseline(normalized);
}

export async function recordView(requestId: string): Promise<CounterStats> {
  if (process.env.COUNTER_DEMO_MODE === "true") {
    const { recordDemoView } = await import("@/lib/demo-counter");
    return applyNotionBaseline(recordDemoView(requestId));
  }

  const { data, error } = await getSupabaseAdmin().rpc("record_counter_view", {
    p_page_key: process.env.COUNTER_PAGE_KEY ?? DEFAULT_PAGE_KEY,
    p_request_id: requestId,
  });

  if (error) throw error;
  return normalizeStats(data);
}

export async function readStats(): Promise<CounterStats> {
  if (process.env.COUNTER_DEMO_MODE === "true") {
    const { readDemoStats } = await import("@/lib/demo-counter");
    return applyNotionBaseline(readDemoStats());
  }

  const { data, error } = await getSupabaseAdmin().rpc("get_counter_stats", {
    p_page_key: process.env.COUNTER_PAGE_KEY ?? DEFAULT_PAGE_KEY,
  });

  if (error) throw error;
  return normalizeStats(data);
}

export async function readDailyStats(): Promise<DailyCounterStat[]> {
  if (process.env.COUNTER_DEMO_MODE === "true") {
    return [];
  }

  const { data, error } = await getSupabaseAdmin().rpc("get_counter_daily_stats", {
    p_page_key: process.env.COUNTER_PAGE_KEY ?? DEFAULT_PAGE_KEY,
  });

  if (error) throw error;

  const rows = (data ?? []) as DailyCounterRpcRow[];

  return rows.map((row) => {
    const views = Number(row.view_count);
    if (!row.view_date || !Number.isSafeInteger(views)) {
      throw new Error("Daily counter stats contained an invalid value.");
    }

    return { date: row.view_date, views };
  });
}
