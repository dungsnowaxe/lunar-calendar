# Vietnamese Lunar Calendar

A Vietnamese lunar calendar. Its features are peers: recording death anniversaries (ngày giỗ), and judging which days tradition favours for a given activity. Two kinds of claim appear throughout and are kept distinct — verifiable astronomy, and recorded folk belief.

## Language

### Calendar foundations

**Âm lịch (lunar date)**:
A day expressed as lunar day, lunar month, and lunar year, with a flag for whether it falls in the leap month. The lunar date is canonical; its solar equivalent is always derived, never stored.
_Avoid_: lunar day (for the whole date), "ngày âm"

**Can–Chi**:
The sexagenary name of a year, month, day, or hour — a Thiên Can paired with a Địa Chi (e.g. Bính Ngọ). Applies to all four cycles, so it is always qualified: ngày Can–Chi, năm Can–Chi.
_Avoid_: con giáp (that is only the Chi), Giáp Tý cycle, sexagenary cycle

**Chi (Địa Chi)**:
One of the twelve branches — Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi — each also an animal.
_Avoid_: zodiac sign, "con giáp" (when the branch itself is meant)

**Tiết khí**:
One of the 24 solar terms. A tiết-khí month is bounded by solar terms and drifts against the lunar month; the two are different lengths and must not be substituted for each other.
_Avoid_: solar month, "tháng dương"

### Day quality

**Việc (activity)**:
A thing a family wants to pick a day for, such as cutting hair or a wedding. Day quality is always quality _for_ a việc; there is no such thing as an unconditionally good day.
_Avoid_: event (already means a recorded memorial), task, purpose

**Ngày tốt / ngày xấu**:
A day tradition judges favourable or unfavourable for a given việc. A belief-layer judgement, not an astronomical fact.
_Avoid_: auspicious day (in user-facing copy), lucky day, "ngày đẹp"

**Điểm ngày**:
A day's 0–100 score for one việc: a fixed baseline plus every rule that applies, clamped at both ends. Always per-việc — a day has no score in isolation.
_Avoid_: rating, "điểm tốt xấu"

**Đánh giá**:
The label a điểm falls into — Rất tốt, Tốt, and downward. A rendering of the score, never an independent judgement.
_Avoid_: tier (in user-facing copy), bậc, level, "mức độ"

**Trực (Thập nhị trực)**:
One of twelve day-officers — Kiến, Trừ, Mãn, Bình, Định, Chấp, Phá, Nguy, Thành, Thu, Khai, Bế — rotating one per day, anchored so that the day whose Chi matches the month's Chi is Trực Kiến.
_Avoid_: day officer, "sao trực", kiến trừ

**Nhị thập bát tú (28 sao)**:
The 28 lunar mansions, rotating one per day in a continuous 28-day cycle that is independent of the lunar month and locked to the weekday.
_Avoid_: lunar mansion (in user-facing copy), "sao chiếu mệnh"

**Trực nhật**:
One of twelve day-deities — Thanh Long, Minh Đường, Thiên Hình and the rest — assigned from the month's Chi and the day's Chi. Half are hoàng đạo, half are hắc đạo.
_Avoid_: day deity, "thần trực nhật"

**Ngày hoàng đạo / ngày hắc đạo**:
A day whose trực nhật is favourable, or unfavourable. Roughly half of every month is each.
_Avoid_: good day / bad day (too general — clashes with ngày tốt)

**Giờ**:
One of twelve double-hours, each named for a Chi. Giờ Tý runs 23:00–01:00 and so straddles midnight. The almanac's unit of time-of-day; the clock hour is not a domain concept.
_Avoid_: hour, canh, "tiếng"

**Giờ hoàng đạo**:
A giờ whose deity is favourable, assigned from the day's Chi. Roughly half of the twelve are hoàng đạo on any given day.
_Avoid_: good hour, "giờ tốt"

**Sao tháng**:
A favourable star assigned by the month — Thiên Đức, Nguyệt Đức, Thiên Hỷ and the rest — that improves a day for many việc at once.
_Avoid_: monthly star, "sao tốt" (ambiguous with the tú)

**Ngày kỵ cố định (bại nhật)**:
A lunar day tabooed for major việc regardless of its other qualities — Tam Nương, Nguyệt Kỵ, Sát Chủ, Thọ Tử, Dương Công Kỵ Nhật. Each is a fixed set of lunar days.
_Avoid_: bad day, "ngày xấu chung"

**Ngày xung**:
A day whose Chi opposes a person's birth-year Chi (Tý↔Ngọ, Sửu↔Mùi, Dần↔Thân, Mão↔Dậu, Thìn↔Tuất, Tỵ↔Hợi). Tradition narrows this further by Can: of the five tuổi sharing the opposing Chi, only two are named xung. For ngày Nhâm Tý those are Bính Ngọ and Mậu Ngọ — not Giáp Ngọ, Canh Ngọ or Nhâm Ngọ — which is why tuổi is offered as one of sixty Can–Chi and never as one of twelve animals. A property of a person and a day together, never of a day alone.
_Avoid_: clash day, "ngày khắc tuổi"

**Tuổi**:
A person's birth-year Can–Chi — one of sixty, e.g. Giáp Tý. Not their age in years, and not merely their animal.
_Avoid_: age, zodiac sign, "mệnh" (that is the element)

**Chủ sự**:
The person a việc is performed for, whose tuổi a ngày xung is checked against. Not necessarily the person holding the device — a ngày giỗ belongs to a family, a haircut belongs to one person.
_Avoid_: user, owner, "gia chủ" (that is specifically the householder)

### Rituals

**Ngày giỗ (memorial event)**:
A death anniversary, recurring yearly on a lunar day and month. Recorded by families; one feature of the calendar among several.
_Avoid_: death anniversary (in user-facing copy), anniversary, "đám giỗ"

**Tang chế (mourning)**:
The period after a close relative's death during which tradition restricts grooming and celebration. Bounded by 49 ngày, 100 ngày, and giỗ đầu.
_Avoid_: "đang có tang" (as a data concept), bereavement

**Cắt tóc máu**:
An infant's first haircut, a distinct rite with its own rules — not an ordinary haircut.
_Avoid_: baby haircut, first trim

**Tháng cô hồn**:
The seventh lunar month, when folk tradition suspends major việc. Named for the xá tội vong nhân rite at its rằm.
_Avoid_: ghost month (in user-facing copy), "tháng 7 âm"

### Epistemics

**Thiên văn (astronomy)**:
The computable, independently verifiable layer: lunar dates, Can–Chi, tiết khí, hours. The app stands behind its correctness.
_Avoid_: calendar layer, "phần lịch"

**Tín ngưỡng dân gian (folk belief)**:
The recorded-tradition layer: which ngày is tốt for which việc. Not independently verifiable, and not a claim about outcomes — the distinction from thiên văn is what makes the term meaningful.
_Avoid_: superstition (dismissive), "phong thuỷ" (a different system), spirituality
