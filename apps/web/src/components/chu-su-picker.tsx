import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { CAN_CHI, type CanChi } from "@lunar/ngay-tot";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { CHU_SU_TOI_DA, TEN_TOI_DA } from "~/lib/chu-su";
import { useChuSu } from "~/hooks/use-chu-su";

/**
 * Base UI's `Select` needs real values, and `null` does not survive the
 * round-trip, so "no chủ sự" is a sentinel rather than an absent value.
 */
const KHONG_CHON = "__khong__";

/** All sixty Can–Chi, in cycle order — not twelve animals. See `CAN_CHI`. */
const TUOI_ITEMS: Record<string, string> = Object.fromEntries(CAN_CHI.map((c) => [c, c]));

const CHU_SU_ITEMS: Record<string, string> = {
  [KHONG_CHON]: "Không chọn chủ sự",
};

/**
 * Choose whose tuổi the day's score is judged for.
 *
 * Tuổi is offered as one of the sixty Can–Chi, never as one of twelve animals,
 * because the tradition's clash set is narrower than the animal: for ngày Nhâm Tý
 * only Bính Ngọ and Mậu Ngọ are xung, and Giáp Ngọ, Canh Ngọ and Nhâm Ngọ are
 * not. A twelve-animal picker would flag all five and be wrong three times out of
 * five.
 *
 * Everything here stays on the device. A birth year is personal data with no
 * bearing on anybody else's calendar, so it is never written to Supabase and
 * never appears in a request.
 */
export function ChuSuPicker() {
  const store = useChuSu();
  const [ten, setTen] = useState("");
  const [tuoi, setTuoi] = useState<CanChi>(CAN_CHI[0]!);

  const items: Record<string, string> = {
    ...CHU_SU_ITEMS,
    ...Object.fromEntries(store.state.nguoi.map((n) => [n.id, `${n.ten} · ${n.tuoi}`])),
  };
  const dayFull = store.state.nguoi.length >= CHU_SU_TOI_DA;

  function handleAdd() {
    if (ten.trim() === "") return;
    store.them(ten, tuoi);
    setTen("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chủ sự</CardTitle>
        <CardDescription>
          Người làm việc này. Tuổi xung làm giảm điểm ngày chứ không loại ngày nào. Chỉ lưu trên
          thiết bị của bạn.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="chu-su-chon">Đang chọn</Label>
          <Select
            items={items}
            value={store.state.chon ?? KHONG_CHON}
            onValueChange={(value) => {
              if (value == null) return;
              store.chon(value === KHONG_CHON ? null : String(value));
            }}
          >
            <SelectTrigger id="chu-su-chon" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={KHONG_CHON}>{CHU_SU_ITEMS[KHONG_CHON]}</SelectItem>
              {store.state.nguoi.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.ten} · {n.tuoi}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {store.state.nguoi.length > 0 && (
          <ul className="flex flex-col gap-1">
            {store.state.nguoi.map((n) => (
              <li
                key={n.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-2.5 py-1.5 text-sm"
              >
                <span className="truncate">
                  {n.ten}
                  <span className="ml-1.5 text-muted-foreground">{n.tuoi}</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Xóa chủ sự ${n.ten}`}
                  onClick={() => store.xoa(n.id)}
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {dayFull ? (
          <p className="text-sm text-muted-foreground">
            Đã đủ {CHU_SU_TOI_DA} chủ sự. Xóa bớt để thêm người mới.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="chu-su-ten">Thêm chủ sự</Label>
            <div className="flex gap-2">
              <Input
                id="chu-su-ten"
                value={ten}
                onChange={(e) => setTen(e.target.value)}
                placeholder="VD: Mẹ, con gái…"
                maxLength={TEN_TOI_DA}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAdd}
                disabled={ten.trim() === ""}
              >
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
                Thêm
              </Button>
            </div>
            <Select
              items={TUOI_ITEMS}
              value={tuoi}
              onValueChange={(value) => {
                if (value != null) setTuoi(String(value));
              }}
            >
              <SelectTrigger className="w-full" aria-label="Tuổi theo Can–Chi">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAN_CHI.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
