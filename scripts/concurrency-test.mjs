const baseUrl = process.env.COUNTER_TEST_URL ?? "http://127.0.0.1:3000";
const count = Number.parseInt(process.env.COUNTER_TEST_COUNT ?? "25", 10);

const before = await fetch(`${baseUrl}/api/stats`, { cache: "no-store" }).then((r) => {
  if (!r.ok) throw new Error(`stats before failed: ${r.status}`);
  return r.json();
});

const requestIds = Array.from({ length: count }, () => crypto.randomUUID());
await Promise.all(
  requestIds.map((requestId) =>
    fetch(`${baseUrl}/api/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    }).then((r) => {
      if (!r.ok) throw new Error(`view failed: ${r.status}`);
      return r.json();
    }),
  ),
);

await Promise.all(
  requestIds.map((requestId) =>
    fetch(`${baseUrl}/api/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    }),
  ),
);

const after = await fetch(`${baseUrl}/api/stats`, { cache: "no-store" }).then((r) => r.json());
const delta = after.total - before.total;

if (delta !== count) {
  throw new Error(`동시 접속 테스트 실패: 예상 ${count}, 실제 ${delta}`);
}

console.log(`동시 요청 ${count}건 및 중복 재호출 방지 테스트 통과`);
