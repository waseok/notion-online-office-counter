import "server-only";

import type { CounterStats } from "@/types/counter";

type DemoState = {
  daily: Map<string, number>;
  requestIds: Set<string>;
};

const globalCounter = globalThis as typeof globalThis & {
  __notionCounterDemo?: DemoState;
};

function state(): DemoState {
  globalCounter.__notionCounterDemo ??= {
    daily: new Map<string, number>(),
    requestIds: new Set<string>(),
  };
  return globalCounter.__notionCounterDemo;
}

function koreanDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function dateParts(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  const day = value.getUTCDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const monday = new Date(value);
  monday.setUTCDate(value.getUTCDate() - mondayOffset);
  const monthStart = `${date.slice(0, 7)}-01`;
  return { monday: monday.toISOString().slice(0, 10), monthStart };
}

export function readDemoStats(initialTotal = 0): CounterStats {
  const current = koreanDate();
  const { monday, monthStart } = dateParts(current);
  const entries = [...state().daily.entries()];
  const sumFrom = (start: string) =>
    entries.reduce((sum, [date, count]) => {
      return date >= start && date <= current ? sum + count : sum;
    }, 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return {
    today: state().daily.get(current) ?? 0,
    week: sumFrom(monday),
    month: sumFrom(monthStart),
    total: total + initialTotal,
  };
}

export function recordDemoView(
  requestId: string,
  initialTotal = 0,
): CounterStats {
  const currentState = state();
  if (!currentState.requestIds.has(requestId)) {
    const current = koreanDate();
    currentState.requestIds.add(requestId);
    currentState.daily.set(current, (currentState.daily.get(current) ?? 0) + 1);
  }
  return readDemoStats(initialTotal);
}
