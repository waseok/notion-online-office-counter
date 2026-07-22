import assert from "node:assert/strict";

function koreanDate(iso) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

assert.equal(koreanDate("2026-07-21T14:59:59.000Z"), "2026-07-21");
assert.equal(koreanDate("2026-07-21T15:00:00.000Z"), "2026-07-22");
assert.equal(koreanDate("2026-12-31T15:00:00.000Z"), "2027-01-01");

console.log("Asia/Seoul 날짜 경계 테스트 통과");
