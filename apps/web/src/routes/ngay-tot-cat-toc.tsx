import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MAX_SOLAR_YEAR, MIN_SOLAR_YEAR, solarToday } from "@lunar/core";
import { NgayTotThang } from "~/components/ngay-tot-thang";
import { seo } from "~/utils/seo";

// Only this route's own tags. `HeadContent` concatenates the meta arrays of every
// matched route, so charSet and viewport are inherited from `__root.tsx`.
export const Route = createFileRoute("/ngay-tot-cat-toc")({
  // The month and the open day are both in the URL, so any day of any month is
  // server-rendered and shareable rather than reachable only by clicking from
  // today's. Out-of-range values are rejected here instead of reaching the
  // almanac.
  validateSearch: z.object({
    nam: z.coerce.number().int().min(MIN_SOLAR_YEAR).max(MAX_SOLAR_YEAR).optional(),
    thang: z.coerce.number().int().min(1).max(12).optional(),
    ngay: z.coerce.number().int().min(1).max(31).optional(),
  }),
  head: () => ({
    meta: [
      ...seo({
        title: "Ngày tốt cắt tóc | Lịch Âm",
        description:
          "Xem ngày tốt cắt tóc theo âm lịch: xếp hạng từng ngày trong tháng kèm điểm, đánh giá và lý do của mỗi ngày theo tín ngưỡng dân gian.",
        keywords:
          "ngày tốt cắt tóc, xem ngày cắt tóc, lịch âm, ngày hoàng đạo, nhị thập bát tú, thập nhị trực",
      }),
    ],
  }),
  component: NgayTotCatTocPage,
});

function NgayTotCatTocPage() {
  const { nam, thang, ngay } = Route.useSearch();
  const today = solarToday();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-6">
      <div className="mb-6">
        <h1 className="font-heading text-xl font-semibold">Ngày tốt cắt tóc</h1>
        <p className="text-sm text-muted-foreground">
          Từng ngày trong tháng, xếp theo điểm cho việc cắt tóc. Mỗi ngày liệt kê đầy đủ các quy tắc
          đã tính và lý do áp dụng.
        </p>
      </div>
      <NgayTotThang year={nam ?? today.year} month={thang ?? today.month} day={ngay ?? null} />
    </main>
  );
}
