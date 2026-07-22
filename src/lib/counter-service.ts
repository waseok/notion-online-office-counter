import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { CounterRpcStats, CounterStats } from "@/types/counter";

const DEFAULT_PAGE_KEY = "online-office-main";

function initialTotal(): number {
  const parsed = Number.parseInt(process.env.COUNTER_INITIAL_TOTAL ?? "0", 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeStats(data: unknown): CounterStats {
  const stats = data as CounterRpcStats | null;
  if (!stats) throw new Error("Counter stats were empty.");

  const normalized = {
    today: Number(stats.today),
    week: Number(stats.week),
    month: Number(stats.month),
    total: Number(stats.total) + initialTotal(),
  };

  if (Object.values(normalized).some((value) => !Number.isSafeInteger(value))) {
    throw new Error("Counter stats contained an invalid number.");
  }

  return normalized;
}

export async function recordView(requestId: string): Promise<CounterStats> {
  if (process.env.COUNTER_DEMO_MODE === "true") {
    const { recordDemoView } = await import("@/lib/demo-counter");
    return recordDemoView(requestId, initialTotal());
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
    return readDemoStats(initialTotal());
  }

  const { data, error } = await getSupabaseAdmin().rpc("get_counter_stats", {
    p_page_key: process.env.COUNTER_PAGE_KEY ?? DEFAULT_PAGE_KEY,
  });

  if (error) throw error;
  return normalizeStats(data);
}
