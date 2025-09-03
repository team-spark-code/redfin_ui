// app/dashboard/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

/* ============ 타입 ============ */
type Category =
  | "technology"
  | "economy"
  | "politics"
  | "society"
  | "sports"
  | "culture"
  | "international";

type EventItem = {
  id: string;
  title: string;
  category: Category;
  start: Date; // KST
  end: Date;
  source?: string;
};
type Timeframe = "daily" | "weekly" | "monthly";

/* ============ 공통 유틸 ============ */
const tz = "Asia/Seoul";
const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

const fmtDate = (d: Date, opt: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: tz, ...opt }).format(d);

const ymd = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

const startOfDay = (d: Date) => new Date(`${ymd(d)}T00:00:00+09:00`);
const endOfDay = (d: Date) => new Date(`${ymd(d)}T23:59:59.999+09:00`);
function startOfWeek(d: Date) {
  const s = startOfDay(d);
  const dow = s.getDay(); // 0=Sun
  const diffToMon = (dow + 6) % 7;
  return new Date(s.getTime() - diffToMon * MS_DAY);
}
function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  return new Date(s.getTime() + 6 * MS_DAY + (MS_DAY - 1));
}
function startOfMonth(d: Date) {
  const s = startOfDay(d);
  return new Date(`${ymd(new Date(s.getFullYear(), s.getMonth(), 1))}T00:00:00+09:00`);
}
function endOfMonth(d: Date) {
  const s = startOfDay(d);
  const last = new Date(s.getFullYear(), s.getMonth() + 1, 0);
  return new Date(`${ymd(last)}T23:59:59.999+09:00`);
}
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const inRange = (t: Date, s: Date, e: Date) =>
  t.getTime() >= s.getTime() && t.getTime() <= e.getTime();

/* ============ 더미 데이터 ============ */
const CATS: Category[] = [
  "technology",
  "economy",
  "politics",
  "society",
  "sports",
  "culture",
  "international",
];
const withTime = (d: Date, hh: number, mm = 0) =>
  new Date(`${ymd(d)}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00+09:00`);

function generateMock(now = new Date()): EventItem[] {
  const events: EventItem[] = [];
  let id = 1;

  // 오늘 8개
  const today = startOfDay(now);
  [8, 9, 11, 13, 15, 18, 20, 21].forEach((h, i) => {
    const st = withTime(today, h, (i * 11) % 50);
    const en = new Date(st.getTime() + (45 + (i % 3) * 30) * 60_000);
    events.push({
      id: `D-${id++}`,
      title: `일간 하이라이트 #${id}`,
      category: CATS[(i + 1) % CATS.length],
      start: st,
      end: en,
      source: "Daily Desk",
    });
  });

  // 이번 주(오늘 제외) 10개
  const mon = startOfWeek(now);
  for (let d = 0; d < 7; d++) {
    const day = new Date(mon.getTime() + d * MS_DAY);
    if (ymd(day) === ymd(today)) continue;
    [10, 14].forEach((h, k) => {
      const st = withTime(day, h, (k * 17 + d * 3) % 55);
      const en = new Date(st.getTime() + (60 + ((k + d) % 2) * 45) * 60_000);
      events.push({
        id: `W-${id++}`,
        title: `주간 체크포인트 #${id}`,
        category: CATS[(d + k + 2) % CATS.length],
        start: st,
        end: en,
        source: "Weekly Post",
      });
    });
  }

  // 이번 달(주간 범위 외) 12개
  const m0 = startOfMonth(now);
  for (let d = 1; d <= 12; d++) {
    const day = new Date(m0.getTime() + d * MS_DAY);
    if (inRange(day, mon, endOfWeek(now))) continue;
    const st = withTime(day, 11, (d * 7) % 50);
    const en = new Date(st.getTime() + (40 + (d % 3) * 30) * 60_000);
    events.push({
      id: `M-${id++}`,
      title: `월간 인사이트 #${id}`,
      category: CATS[(d + 1) % CATS.length],
      start: st,
      end: en,
      source: "Monthly Digest",
    });
  }
  return events;
}

/* ============ 겹침 레이아웃 ============ */
type LaidEvent = EventItem & { lane: number };
function layoutLanes(items: EventItem[]): LaidEvent[] {
  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
  const laneEnds: Date[] = [];
  const out: LaidEvent[] = [];
  for (const ev of sorted) {
    let lane = 0;
    for (; lane < laneEnds.length; lane++) {
      if (ev.start.getTime() >= laneEnds[lane].getTime()) break;
    }
    laneEnds[lane] = ev.end;
    out.push({ ...ev, lane });
  }
  return out;
}

/* ============ 카테고리 색상 ============ */
const CAT_BORDER: Record<Category, string> = {
  technology: "border-l-blue-500",
  economy: "border-l-emerald-500",
  politics: "border-l-rose-500",
  society: "border-l-violet-500",
  sports: "border-l-amber-500",
  culture: "border-l-teal-500",
  international: "border-l-indigo-500",
};
const CAT_TEXT: Record<Category, string> = {
  technology: "text-blue-600",
  economy: "text-emerald-600",
  politics: "text-rose-600",
  society: "text-violet-600",
  sports: "text-amber-600",
  culture: "text-teal-600",
  international: "text-indigo-600",
};

/* ============ Toolbar ============ */
function Toolbar({
  timeframe,
  onChange,
  cursor,
  setCursor,
}: {
  timeframe: Timeframe;
  onChange: (t: Timeframe) => void;
  cursor: Date;
  setCursor: (d: Date) => void;
}) {
  const label =
    timeframe === "daily"
      ? fmtDate(cursor, { month: "long", day: "numeric", weekday: "short" })
      : timeframe === "weekly"
      ? `${fmtDate(startOfWeek(cursor), { month: "numeric", day: "numeric" })} ~ ${fmtDate(
          endOfWeek(cursor),
          { month: "numeric", day: "numeric" }
        )}`
      : fmtDate(cursor, { year: "numeric", month: "long" });

  const jump = (dir: -1 | 1) => {
    if (timeframe === "daily") setCursor(new Date(cursor.getTime() + dir * MS_DAY));
    else if (timeframe === "weekly") setCursor(new Date(cursor.getTime() + dir * 7 * MS_DAY));
    else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 py-2">
      <div className="flex gap-2 flex-wrap">
        {(["daily", "weekly", "monthly"] as Timeframe[]).map((t) => (
          <button
            key={t}
            className={[
              "px-3 py-2 rounded-full border text-sm font-semibold",
              t === timeframe
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-accent",
            ].join(" ")}
            onClick={() => onChange(t)}
          >
            {t === "daily" ? "일간" : t === "weekly" ? "주간" : "월간"}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 font-semibold">
        <button className="px-2 py-1 rounded-md border bg-card hover:bg-accent" onClick={() => jump(-1)}>
          ◀
        </button>
        <span className="min-w-[180px] text-center">{label}</span>
        <button className="px-2 py-1 rounded-md border bg-card hover:bg-accent" onClick={() => jump(1)}>
          ▶
        </button>
        <button className="ml-1 px-3 py-1 rounded-md border bg-muted hover:bg-accent" onClick={() => setCursor(new Date())}>
          오늘
        </button>
      </div>
    </div>
  );
}

/* ============ Day Timeline (라벨 여백 확보) ============ */
function DayTimeline({ events, base }: { events: EventItem[]; base: Date }) {
  const TRACK_H = 224; // px
  const LANE_H = 44;   // px
  const GUTTER_TOP = 36; // ✅ 라벨 높이만큼 이벤트를 아래로 내리는 여백

  const dayStart = startOfDay(base);
  const dayEnd = endOfDay(base);

  const items = useMemo(
    () =>
      layoutLanes(
        events
          .filter(
            (e) =>
              inRange(e.start, dayStart, dayEnd) ||
              inRange(e.end, dayStart, dayEnd) ||
              (e.start <= dayStart && e.end >= dayEnd)
          )
          .map((e) => ({
            ...e,
            start: new Date(Math.max(e.start.getTime(), dayStart.getTime())),
            end: new Date(Math.min(e.end.getTime(), dayEnd.getTime())),
          }))
      ),
    [events, base]
  );

  const totalMs = 24 * MS_HOUR;
  const leftPct = (t: Date) => ((t.getTime() - dayStart.getTime()) / totalMs) * 100;
  const widthPct = (ms: number) => (ms / totalMs) * 100;

  const now = new Date();
  const showNow = ymd(now) === ymd(base);
  const nowLeft = clamp(leftPct(now), 0, 100);

  return (
    <div className="border rounded-xl bg-card p-4">
      <div className="relative rounded-lg bg-slate-50 overflow-hidden" style={{ height: TRACK_H }}>
        {/* 시간 눈금 + 라벨 */}
        {Array.from({ length: 25 }).map((_, h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 w-px border-l border-dashed border-slate-200"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            <span
              className="absolute z-10 pointer-events-none text-[11px] text-slate-500 bg-white border border-slate-200 rounded px-1"
              style={{ top: 6, left: 0, transform: "translateX(-50%)" }}
            >
              {String(h).padStart(2, "0")}:00
            </span>
          </div>
        ))}

        {/* 현재 시간 라인 */}
        {showNow && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-500 to-rose-400 shadow-[0_0_0_2px_rgba(244,63,94,0.1)]"
            style={{ left: `${nowLeft}%` }}
          />
        )}

        {/* 이벤트 */}
        {items.map((e) => {
          const left = leftPct(e.start);
          const width = widthPct(e.end.getTime() - e.start.getTime());
          const top = GUTTER_TOP + e.lane * LANE_H; // ✅ 라벨 여백만큼 내려 배치
          return (
            <div
              key={e.id}
              className={[
                "absolute h-10 pr-2 pl-3 rounded-lg bg-white border shadow-sm overflow-hidden",
                "border-l-4",
                CAT_BORDER[e.category],
              ].join(" ")}
              style={{ left: `${left}%`, width: `${width}%`, top }}
              title={`${e.title} (${fmtDate(e.start, { hour: "2-digit", minute: "2-digit" })}~${fmtDate(
                e.end,
                { hour: "2-digit", minute: "2-digit" }
              )})`}
            >
              <div className="text-[12px] font-bold truncate">{e.title}</div>
              <div className="text-[11px] text-slate-500">
                {fmtDate(e.start, { hour: "2-digit", minute: "2-digit" })}–{fmtDate(e.end, { hour: "2-digit", minute: "2-digit" })} ·{" "}
                {e.category}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ Week Timeline (명시적 gridTemplateColumns + 픽셀 높이) ============ */
function WeekTimeline({ events, base }: { events: EventItem[]; base: Date }) {
  const TRACK_H = 720; // px
  const s = startOfWeek(base);
  const days = Array.from({ length: 7 }).map((_, i) => new Date(s.getTime() + i * MS_DAY));

  const byDay = days.map((d) =>
    layoutLanes(
      events
        .filter((ev) => ymd(ev.start) === ymd(d) || ymd(ev.end) === ymd(d))
        .map((ev) => {
          const dayS = startOfDay(d);
          const dayE = endOfDay(d);
          return {
            ...ev,
            start: new Date(Math.max(ev.start.getTime(), dayS.getTime())),
            end: new Date(Math.min(ev.end.getTime(), dayE.getTime())),
          };
        })
    )
  );

  const topPct = (d: Date) => ((d.getTime() - startOfDay(d).getTime()) / MS_DAY) * 100;
  const heightPct = (st: Date, en: Date) => ((en.getTime() - st.getTime()) / MS_DAY) * 100;

  const now = new Date();
  const todayIdx = days.findIndex((d) => ymd(d) === ymd(now));
  const nowTop = clamp(topPct(now), 0, 100);

  return (
    <div className="border rounded-xl bg-card p-4">
      <div className="grid gap-2" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
        {/* 시간 라벨 컬럼 */}
        <div className="relative border-r" style={{ height: TRACK_H }}>
          {Array.from({ length: 25 }).map((_, h) => (
            <div
              key={h}
              className="relative border-t border-dashed border-slate-200 text-[11px] text-slate-500"
              style={{ height: TRACK_H / 24 }}
            >
              <span className="absolute -top-2">{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {/* 7일 컬럼 */}
        {days.map((d, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="flex items-center gap-1 font-bold mb-1">
              <div className={`w-2 h-2 rounded-full ${idx === todayIdx ? "bg-rose-500" : "bg-slate-300"}`} />
              <div className="text-[13px]">{fmtDate(d, { month: "numeric", day: "numeric" })}</div>
              <div className="text-[11px] text-slate-500">{fmtDate(d, { weekday: "short" })}</div>
            </div>

            <div className="relative rounded-lg border bg-slate-50 overflow-hidden" style={{ height: TRACK_H }}>
              {/* 가로 눈금 */}
              {Array.from({ length: 25 }).map((_, h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-dashed border-slate-200 h-px"
                  style={{ top: `${(h / 24) * 100}%` }}
                />
              ))}

              {/* 오늘 now 라인 */}
              {idx === todayIdx && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_0_2px_rgba(244,63,94,0.08)]"
                  style={{ top: `${nowTop}%` }}
                />
              )}

              {/* 이벤트 */}
              {byDay[idx].map((ev) => {
                const top = topPct(ev.start);
                const height = Math.max(heightPct(ev.start, ev.end), 1);
                const left = 6 + ev.lane * 7; // lane 간격
                return (
                  <div
                    key={ev.id}
                    className={[
                      "absolute right-[6%] px-2 py-1 rounded-lg bg-white border shadow-sm overflow-hidden",
                      "border-l-4",
                      CAT_BORDER[ev.category],
                    ].join(" ")}
                    style={{ top: `${top}%`, height: `${height}%`, left: `${left}%` }}
                    title={`${ev.title} (${fmtDate(ev.start, { hour: "2-digit", minute: "2-digit" })} ~ ${fmtDate(ev.end, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })})`}
                  >
                    <div className="text-[12px] font-bold truncate">{ev.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {fmtDate(ev.start, { hour: "2-digit", minute: "2-digit" })} · {ev.category}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Month Calendar ============ */
function MonthCalendar({ events, base }: { events: EventItem[]; base: Date }) {
  const m0 = startOfMonth(base);
  const firstCell = startOfWeek(m0).getTime();
  const gridDays = Array.from({ length: 42 }).map((_, i) => new Date(firstCell + i * MS_DAY));

  const byYMD = new Map<string, EventItem[]>();
  for (const ev of events) {
    const k = ymd(ev.start);
    if (!byYMD.has(k)) byYMD.set(k, []);
    byYMD.get(k)!.push(ev);
  }

  const isSameMonth = (d: Date) => d.getFullYear() === m0.getFullYear() && d.getMonth() === m0.getMonth();
  const today = ymd(new Date());

  return (
    <div className="border rounded-xl bg-card p-4">
      <div className="grid grid-cols-7 gap-2 font-bold text-slate-600 mb-2">
        {["월", "화", "수", "목", "금", "토", "일"].map((w) => (
          <div key={w} className="text-center py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {gridDays.map((d, i) => {
          const key = ymd(d);
          const list = (byYMD.get(key) || []).slice(0, 4);
          return (
            <div
              key={i}
              className={[
                "relative h-32 border rounded-lg p-2 bg-gradient-to-b from-slate-50/70 to-white",
                !isSameMonth(d) ? "opacity-60" : "",
                key === today ? "outline outline-2 outline-rose-500 outline-offset-2" : "",
              ].join(" ")}
            >
              <div className="text-xs font-extrabold text-slate-900 mb-1 flex justify-between">
                <span>{fmtDate(d, { day: "numeric" })}</span>
              </div>

              <div className="grid gap-1">
                {list.map((ev) => (
                  <div
                    key={ev.id}
                    className={[
                      "text-[12px] px-2 py-1 rounded-md bg-white border shadow-sm truncate",
                      "border-l-4",
                      CAT_BORDER[ev.category],
                      CAT_TEXT[ev.category],
                    ].join(" ")}
                    title={`${ev.title} · ${ev.category}`}
                  >
                    {ev.title}
                  </div>
                ))}
                {byYMD.get(key) && byYMD.get(key)!.length > 4 && (
                  <div className="text-[12px] text-slate-500">+ {byYMD.get(key)!.length - 4} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ 페이지 ============ */
export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading] = useState(false);
  const [isLoggedIn] = useState(false);

  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");
  const [cursor, setCursor] = useState<Date>(new Date());

  const all = useMemo(() => generateMock(new Date()), []);

  const range = useMemo(() => {
    if (timeframe === "daily") return [startOfDay(cursor), endOfDay(cursor)] as const;
    if (timeframe === "weekly") return [startOfWeek(cursor), endOfWeek(cursor)] as const;
    return [startOfMonth(cursor), endOfMonth(cursor)] as const;
  }, [timeframe, cursor]);

  const list = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return all
      .filter((e) => inRange(e.start, range[0], range[1]) || inRange(e.end, range[0], range[1]))
      .filter((e) => selectedCategory === "all" || e.category === (selectedCategory as Category))
      .filter((e) => (!q ? true : e.title.toLowerCase().includes(q)));
  }, [all, range, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onRefresh={() => setCursor(new Date())}
        isLoading={isLoading}
        isLoggedIn={isLoggedIn}
        onSignupClick={() => {}}
      />

      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        <div>
          <h1 className="text-xl font-bold">뉴스 타임라인 대시보드</h1>
          <p className="text-sm text-muted-foreground mt-1">
            일/주/월 단위로 시간 흐름을 한눈에 — 상단 검색/카테고리 선택이 그대로 반영됩니다.
          </p>
        </div>

        <Toolbar timeframe={timeframe} onChange={setTimeframe} cursor={cursor} setCursor={setCursor} />

        {timeframe === "daily" && <DayTimeline events={list} base={cursor} />}
        {timeframe === "weekly" && <WeekTimeline events={list} base={cursor} />}
        {timeframe === "monthly" && <MonthCalendar events={list} base={cursor} />}

        <p className="text-xs text-muted-foreground">
          ※ 현재는 더미 데이터로 UI 미리보기 중. 실제 연동 시 <code>EventItem[]</code>만 서버에서 주입하면 됩니다.
        </p>
      </main>

      <Footer />
    </div>
  );
}
