// app/lib/categoryStyle.ts
import type { Icon as LucideIcon } from "lucide-react";
import {
  Landmark, Scale, Vote,                       // politics
  Banknote, LineChart, PiggyBank,              // economy
  Users, Megaphone, Shield,                    // society
  Palette, Film, Music2,                       // culture
  Globe2, Languages, Plane,                    // international
  Trophy, Dumbbell, Volleyball,                // sports
  Cpu, CircuitBoard, Bot,                      // technology
  HelpCircle,                                  // uncategorized
} from "lucide-react";

export type CatKey =
  | "politics" | "economy" | "society" | "culture"
  | "international" | "sports" | "technology"
  | "uncategorized" | "all";

/** 입력 카테고리를 내부 키로 통일 */
const toKey = (cat?: string): CatKey => {
  const k = (cat ?? "").toLowerCase().trim();
  if (["politics","economy","society","culture","international","sports","technology"].includes(k)) {
    return k as CatKey;
  }
  if (["tech","technology & product","science","it"].includes(k)) return "technology";
  if (["world","global","intl"].includes(k)) return "international";
  if (k === "all") return "all";
  return "uncategorized";
};

/** 카테고리 톤: 단색 + 보더 + 그라데이션 */
export const TONE: Record<CatKey, {
  text: string;   // 글자색
  bg: string;     // 배지/아이콘 배경
  border: string; // 테두리색
  faint: string;  // 옅은 배경
  ring: string;   // 포커스 링
  grad: string;   // 그라데이션 타일 (bg-gradient-to-br ... )
}> = {
  politics:      { text:"text-rose-700",      bg:"bg-rose-100",      border:"border-rose-300",      faint:"bg-rose-50",      ring:"ring-rose-200",      grad:"bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/20 dark:to-transparent" },
  economy:       { text:"text-amber-700",     bg:"bg-amber-100",     border:"border-amber-300",     faint:"bg-amber-50",     ring:"ring-amber-200",     grad:"bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-transparent" },
  society:       { text:"text-emerald-700",   bg:"bg-emerald-100",   border:"border-emerald-300",   faint:"bg-emerald-50",   ring:"ring-emerald-200",   grad:"bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-transparent" },
  culture:       { text:"text-fuchsia-700",   bg:"bg-fuchsia-100",   border:"border-fuchsia-300",   faint:"bg-fuchsia-50",   ring:"ring-fuchsia-200",   grad:"bg-gradient-to-br from-fuchsia-50 to-white dark:from-fuchsia-900/20 dark:to-transparent" },
  international: { text:"text-cyan-700",      bg:"bg-cyan-100",      border:"border-cyan-300",      faint:"bg-cyan-50",      ring:"ring-cyan-200",      grad:"bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/20 dark:to-transparent" },
  sports:        { text:"text-lime-700",      bg:"bg-lime-100",      border:"border-lime-300",      faint:"bg-lime-50",      ring:"ring-lime-200",      grad:"bg-gradient-to-br from-lime-50 to-white dark:from-lime-900/20 dark:to-transparent" },
  technology:    { text:"text-indigo-700",    bg:"bg-indigo-100",    border:"border-indigo-300",    faint:"bg-indigo-50",    ring:"ring-indigo-200",    grad:"bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-transparent" },
  uncategorized: { text:"text-slate-700",     bg:"bg-slate-100",     border:"border-slate-300",     faint:"bg-slate-50",     ring:"ring-slate-200",     grad:"bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/20 dark:to-transparent" },
  all:           { text:"text-slate-700",     bg:"bg-slate-100",     border:"border-slate-300",     faint:"bg-slate-50",     ring:"ring-slate-200",     grad:"bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/20 dark:to-transparent" },
};

/** 카테고리 대표 아이콘(고정) */
const ICON: Record<CatKey, LucideIcon> = {
  politics: Landmark,
  economy: Banknote,
  society: Users,
  culture: Palette,
  international: Globe2,
  sports: Trophy,
  technology: Cpu,
  uncategorized: HelpCircle,
  all: Globe2,
};

/** 색/아이콘 헬퍼 */
export const getCatStyle = (cat?: string) => TONE[toKey(cat)];
export const getCategoryIcon = (cat?: string): LucideIcon => ICON[toKey(cat)];

/** UI 라벨 */
export const categoryLabels: Record<string, string> = {
  all: "전체",
  politics: "정치",
  economy: "경제",
  society: "사회",
  culture: "문화",
  international: "국제",
  sports: "스포츠",
  technology: "기술",
  Uncategorized: "미분류",
};
