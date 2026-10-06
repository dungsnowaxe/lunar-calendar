# Belief data lives outside `@lunar/core`

Day-quality rules split into two packages. **Astronomy** — tiết khí, thập nhị trực, nhị thập bát tú, trực nhật, and the twelve giờ with their presiding deities — stays in `@lunar/core`. **Belief data** — the per-việc weight tables, ngày kỵ lists, việc definitions, đánh giá thresholds, _and which deities count as hoàng đạo_ — goes in a new `packages/ngay-tot`.

The reference canon asks its readers to hold exactly this line: the astronomical layer is _"kết quả tính toán thiên văn, có thể kiểm chứng độc lập"_ and they stand behind it, while day-selection is _"**tín ngưỡng dân gian**, được ghi lại từ thư tịch cổ… không xem đó là căn cứ khoa học"_. `packages/lunar/src/hnd.ts` makes the same claim about itself — _"Do not modify the astronomy; all correctness guarantees live in the test suite."_ Putting disputed folk weights inside a package whose contract is verifiable astronomy would make that header untrue.

## Considered Options

- **Everything in `@lunar/core`.** Fewest imports, one dependency. Rejected: conflates a layer we can prove with a layer we cannot, and makes the package's test suite mean two different things at once.
- **Belief data in `apps/web/src/lib`.** No third workspace package. Rejected: the weights become untestable outside the web app, and `packages/ngay-tot` is where the canon's published API fixtures want to live as golden tests.

## Consequences

- `@lunar/core` gains no opinion about what any day is _for_. It answers "what is this day?" — its Can–Chi, Trực, tú, tiết khí, and which deity presides over it and each of its giờ — and stops there. `packages/ngay-tot` answers "is it good for this việc?", and depends on `@lunar/core`, never the reverse.
- When the canon publishes an erratum, the fix is a table edit in `packages/ngay-tot`. No astronomy package changes, and no astronomy test is touched.
- The two packages have different fixture sources, which is the point: `@lunar/core` is verified against computed astronomy and its own invariants (e.g. a tú's luminary must match its weekday's), `packages/ngay-tot` against the canon's published per-day scores.
- A new `việc` is a data change in `packages/ngay-tot` plus a surface in `apps/web`. It never requires touching `@lunar/core`.

## Boundary cases settled during implementation

Two cases arose where the line was not obvious. Both were decided rather than left implicit.

**Deity favourability is belief data.** `trucNhatOf` and `gioOf` compute _which_ of the twelve deities presides — a deterministic rotation, verifiable against published almanacs. Whether six of those twelve are hoàng đạo (favourable) and six hắc đạo is not computed from anything; it is a traditional judgment. It was first implemented as a `hoangDao: boolean` inside `@lunar/core`, which put a good/bad verdict in the package whose header promises verifiable astronomy. The set moved to `packages/ngay-tot`. Core now returns names only.

The test data follows the same line: `packages/lunar/test/fixtures/almanac-days.json` deliberately omits the canon's `hoang_dao` flag, even though the API supplies it.

**Orthography is normalised at the boundary, not changed.** `@lunar/core` spells the sixth Chi `Tỵ`; the reference canon spells it `Tị`. Both are accepted Vietnamese. The library's spelling is pre-existing and already user-facing, so it stays, and canon-derived strings are normalised on comparison. This matters concretely: five of the sixty Can–Chi a chủ sự can be born in (`Ất Tị`, `Đinh Tị`, `Kỷ Tị`, `Tân Tị`, `Quý Tị`) contain the branch, so an unnormalised comparison against the canon's `tuoi_xung` list would silently never match them.
