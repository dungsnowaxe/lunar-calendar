import assert from "node:assert/strict";
import test from "node:test";

import {
  CHU_SU_KEY,
  CHU_SU_TOI_DA,
  TEN_TOI_DA,
  chonChuSu,
  chuSuDuocChon,
  parseChuSu,
  serializeChuSu,
  suaChuSu,
  themChuSu,
  xoaChuSu,
  type ChuSuState,
} from "./chu-su.ts";

/** A state with two chủ sự, the second selected. Ids are fixed for assertions. */
const HAI_NGUOI: ChuSuState = {
  nguoi: [
    { id: "a", ten: "Mẹ", tuoi: "Giáp Tý" },
    { id: "b", ten: "Cha", tuoi: "Bính Ngọ" },
  ],
  chon: "b",
};

test("the store key is the bare, unnamespaced one the app already uses", () => {
  assert.equal(CHU_SU_KEY, "chu-su");
});

test("empty and corrupt storage both read back as no chủ sự", () => {
  assert.deepEqual(parseChuSu(null), { nguoi: [], chon: null });
  assert.deepEqual(parseChuSu(""), { nguoi: [], chon: null });
  assert.deepEqual(parseChuSu("not json"), { nguoi: [], chon: null });
  assert.deepEqual(parseChuSu("[1,2,3]"), { nguoi: [], chon: null });
  assert.deepEqual(parseChuSu('"Mẹ"'), { nguoi: [], chon: null });
  // `localStorage` is untrusted text a user can edit by hand; nothing here may
  // throw, because a bad value would otherwise take the page down.
  assert.deepEqual(parseChuSu('{"nguoi":"nope","chon":7}'), { nguoi: [], chon: null });
});

test("invalid entries are dropped rather than trusted", () => {
  const raw = JSON.stringify({
    nguoi: [
      { id: "ok", ten: "Mẹ", tuoi: "Giáp Tý" },
      { id: "bad-tuoi", ten: "Ai đó", tuoi: "Giáp Sửu" }, // odd pairing, not a Can–Chi
      { id: "bad-tuoi-2", ten: "Ai đó", tuoi: "Con Rồng" },
      { id: "blank", ten: "   ", tuoi: "Ất Tỵ" },
      { id: "", ten: "Không id", tuoi: "Ất Tỵ" },
      { id: "ok", ten: "Trùng id", tuoi: "Bính Dần" },
      { ten: "Thiếu id", tuoi: "Đinh Mão" },
      "chuỗi",
      null,
      { id: "thieu-tuoi", ten: "Không tuổi" },
    ],
    chon: "bad-tuoi",
  });
  const parsed = parseChuSu(raw);
  // Only the first survives: the duplicate id is dropped, not merged.
  assert.deepEqual(parsed.nguoi, [{ id: "ok", ten: "Mẹ", tuoi: "Giáp Tý" }]);
  // A selection pointing at a dropped entry is no selection, not an arbitrary one.
  assert.equal(parsed.chon, null);
});

test("the list is capped, and a long tên is trimmed not rejected", () => {
  const nguoi = Array.from({ length: CHU_SU_TOI_DA + 5 }, (_, i) => ({
    id: `id-${i}`,
    ten: `Người ${i}`,
    tuoi: "Giáp Tý",
  }));
  const parsed = parseChuSu(JSON.stringify({ nguoi, chon: null }));
  assert.equal(parsed.nguoi.length, CHU_SU_TOI_DA);

  const long = parseChuSu(
    JSON.stringify({ nguoi: [{ id: "x", ten: "A".repeat(200), tuoi: "Quý Hợi" }], chon: null }),
  );
  assert.equal(long.nguoi[0]!.ten.length, TEN_TOI_DA);
});

test("serializing and parsing round-trips", () => {
  assert.deepEqual(parseChuSu(serializeChuSu(HAI_NGUOI)), HAI_NGUOI);
  assert.deepEqual(parseChuSu(serializeChuSu({ nguoi: [], chon: null })), {
    nguoi: [],
    chon: null,
  });
});

test("adding a chủ sự selects it, and rejects bad input", () => {
  const added = themChuSu({ nguoi: [], chon: null }, { ten: "  Mẹ  ", tuoi: "Giáp Tý" });
  assert.equal(added.nguoi.length, 1);
  assert.equal(added.nguoi[0]!.ten, "Mẹ", "tên should be trimmed");
  assert.equal(added.chon, added.nguoi[0]!.id, "a new chủ sự becomes the selected one");
  assert.ok(added.nguoi[0]!.id.length > 0, "an id is generated");

  const empty = { nguoi: [], chon: null } as const;
  assert.deepEqual(themChuSu(empty, { ten: "   ", tuoi: "Giáp Tý" }), empty);
  assert.deepEqual(themChuSu(empty, { ten: "Mẹ", tuoi: "Giáp Sửu" }), empty);

  // Full list: refuse rather than silently evict someone.
  const full = {
    nguoi: Array.from({ length: CHU_SU_TOI_DA }, (_, i) => ({
      id: `id-${i}`,
      ten: `Người ${i}`,
      tuoi: "Giáp Tý" as const,
    })),
    chon: null,
  };
  assert.deepEqual(themChuSu(full, { ten: "Thêm", tuoi: "Ất Sửu" }), full);
});

test("editing keeps an invalid patch from corrupting an entry", () => {
  const blanked = suaChuSu(HAI_NGUOI, "a", { ten: "   " });
  assert.equal(blanked.nguoi[0]!.ten, "Mẹ", "a blank tên must not replace a real one");

  const badTuoi = suaChuSu(HAI_NGUOI, "a", { tuoi: "Giáp Sửu" });
  assert.equal(badTuoi.nguoi[0]!.tuoi, "Giáp Tý");

  const good = suaChuSu(HAI_NGUOI, "a", { ten: "Má", tuoi: "Quý Hợi" });
  assert.deepEqual(good.nguoi[0], { id: "a", ten: "Má", tuoi: "Quý Hợi" });
  // Editing someone else does not move the selection.
  assert.equal(good.chon, "b");

  assert.deepEqual(suaChuSu(HAI_NGUOI, "không-tồn-tại", { ten: "X" }), HAI_NGUOI);
});

test("removing the selected chủ sự clears the selection", () => {
  assert.deepEqual(xoaChuSu(HAI_NGUOI, "b"), { nguoi: [HAI_NGUOI.nguoi[0]!], chon: null });
  // Removing someone else leaves the selection alone.
  assert.deepEqual(xoaChuSu(HAI_NGUOI, "a"), { nguoi: [HAI_NGUOI.nguoi[1]!], chon: "b" });
  assert.deepEqual(xoaChuSu(HAI_NGUOI, "không-tồn-tại"), HAI_NGUOI);
});

test("selecting an unknown id is refused", () => {
  assert.deepEqual(chonChuSu(HAI_NGUOI, "ma"), HAI_NGUOI);
  assert.deepEqual(chonChuSu(HAI_NGUOI, null), { ...HAI_NGUOI, chon: null });
  assert.deepEqual(chonChuSu(HAI_NGUOI, "a"), { ...HAI_NGUOI, chon: "a" });
});

test("the selected chủ sự is what the kernel receives, or null", () => {
  // The kernel takes `{ ten, tuoi }` only — no id, no storage detail leaks out.
  assert.deepEqual(chuSuDuocChon(HAI_NGUOI), { ten: "Cha", tuoi: "Bính Ngọ" });
  assert.equal(chuSuDuocChon({ ...HAI_NGUOI, chon: null }), null);
  assert.equal(chuSuDuocChon({ nguoi: [], chon: null }), null);
  // A dangling selection can only arise from hand-edited storage, but must not
  // crash the page or score against an arbitrary person.
  assert.equal(chuSuDuocChon({ ...HAI_NGUOI, chon: "đã-xóa" }), null);
});

test("no chủ sự is a normal state, not an error", () => {
  // Task 4.4: the day-quality verdict is shown unchanged when nobody has been
  // entered. That only works if "none selected" is representable and harmless.
  const none = parseChuSu(null);
  assert.equal(chuSuDuocChon(none), null);
  assert.deepEqual(none, { nguoi: [], chon: null });
});
