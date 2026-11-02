/** Locked Vietnamese copy deck. Do not rephrase. */

export const COPY = {
  navLich: "Lịch",
  navSuKien: "Sự kiện",
  navNgayTot: "Ngày tốt",
  logo: "Lịch Âm",
  todayControl: "Hôm nay",
  upcomingTitle: "Ngày giỗ sắp tới",
  addMemorial: "Thêm ngày giỗ",
  addMemorialButton: "+ Thêm ngày giỗ",
  remaining: "Còn",
  days: "ngày",
  eventsTitle: "Sự kiện giỗ",
  eventsSubtitle: "Lưu theo ngày âm lịch. Ngày dương lịch mình tính lại mỗi năm giúp bạn.",
  addEvent: "+ Thêm sự kiện",
  addEventLabel: "Thêm sự kiện",
  emptyTitle: "Chưa có ngày giỗ nào",
  emptyBody:
    "Thêm ngày giỗ ông bà, cha mẹ theo âm lịch — mình sẽ nhắc bạn trước mỗi năm, không để bạn quên.",
  emptyCta: "+ Thêm ngày giỗ đầu tiên",
  emptyCtaLabel: "Thêm ngày giỗ đầu tiên",
  formAddTitle: "Thêm sự kiện giỗ",
  formEditTitle: "Sửa sự kiện giỗ",
  formHelp:
    "Nhập ngày âm lịch — giỗ sẽ lặp đúng ngày đó mỗi năm. Bạn có thể thêm nhiều ngày một lúc.",
  nameLabel: "Tên sự kiện",
  namePlaceholder: "VD: Giỗ ông nội, giỗ bà ngoại…",
  colorLabel: "Màu",
  lunarBlock: "Ngày âm lịch",
  dayLabel: "Ngày",
  monthLabel: "Tháng",
  addDate: "+ Thêm ngày",
  addDateLabel: "Thêm ngày",
  autoNextHint: "Lần tới sẽ tính tự động theo năm âm.",
  noteLabel: "Ghi chú",
  notePlaceholder: "VD: Cúng buổi trưa, thắp hương ở nhà thờ họ…",
  cancel: "Hủy",
  saveAdd: "Thêm sự kiện",
  saveEdit: "Lưu thay đổi",
  deleteTitle: "Xóa sự kiện?",
  deleteConfirm: "Xóa",
  deleteCancel: "Giữ lại",
  daySelected: "Ngày đã chọn",
  memorialsThatDay: "Ngày giỗ trong ngày này",
  nextOccurrence: "Lần tới",
  lunarParen: "(âm lịch)",
  edit: "Sửa",
  delete: "Xóa",
  followingPrefix: "Sau đó:",
} as const;

export function monthHeading(month: number, year: number): string {
  return `Tháng ${month}, ${year}`;
}

export function remainingDays(n: number): string {
  return `Còn ${n} ngày`;
}

export function followingYears(dates: string[]): string {
  return `Sau đó: ${dates.join(" · ")}`;
}

export function lunarRule(day: number, month: number): string {
  return `Ngày ${day} tháng ${month} (âm lịch)`;
}

export function deleteBody(name: string): string {
  return `Bạn có chắc muốn xóa “${name}”? Xóa rồi không hoàn tác được đâu.`;
}

export function lunarToSolarLine(lunarDay: number, lunarMonth: number, solar: string): string {
  return `${lunarDay}/${lunarMonth} âm → ${solar}`;
}
