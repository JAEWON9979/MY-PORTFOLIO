"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScheduleModal from "@/components/schedule/ScheduleModal";
import { useSchedules, type Schedule, type ScheduleInput } from "@/hooks/useSchedules";
import { useAuth } from "@/hooks/useAuth";

// ── calendar helpers ──────────────────────────────────────────────────────────

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0 = Sun

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  const rem = days.length % 7;
  if (rem !== 0) {
    for (let d = 1; d <= 7 - rem; d++) {
      days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }
  }

  return days;
}

function formatSelectedDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = DOW[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${dow})`;
}

// ── component ─────────────────────────────────────────────────────────────────

type ModalMode =
  | { type: "add"; date: string }
  | { type: "edit"; schedule: Schedule };

export default function SchedulePage() {
  const { user, isLoaded: authLoaded } = useAuth();
  const [today] = useState(() => toDateStr(new Date()));
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const { schedules, isLoaded, addSchedule, updateSchedule, deleteSchedule } =
    useSchedules(year, month);
  const [modal, setModal] = useState<ModalMode | null>(null);

  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month]);

  // Map dateStr → schedule list (for quick cell lookup)
  const scheduleMap = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const s of schedules) {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    }
    return map;
  }, [schedules]);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
  };

  const handleModalSubmit = async (input: ScheduleInput) => {
    if (!modal) return;
    try {
      if (modal.type === "edit") {
        await updateSchedule(modal.schedule.id, input);
      } else {
        await addSchedule(input);
      }
      setModal(null);
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;
    try {
      await deleteSchedule(id);
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const selectedSchedules = selectedDate ? (scheduleMap.get(selectedDate) ?? []) : [];

  // ── auth guards ──────────────────────────────────────────────────────────────

  if (!authLoaded) {
    return (
      <div className="flex flex-1 flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-400">확인 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-zinc-600">일정 관리 페이지는 로그인이 필요합니다.</p>
            <Link
              href="/auth/login"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              로그인
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-12">

          {/* Page title + month nav */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-zinc-900">일정</h1>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="이전 달"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 3L5 8l5 5" />
                </svg>
              </button>
              <span className="min-w-[100px] text-center text-base font-semibold text-zinc-900">
                {year}년 {month + 1}월
              </span>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="다음 달"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 3l5 5-5 5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setYear(now.getFullYear());
                  setMonth(now.getMonth());
                  setSelectedDate(today);
                }}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                오늘
              </button>
            </div>
          </div>

          {/* Main layout: calendar + day panel */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

            {/* ── Calendar ─────────────────────────────────────────────────── */}
            <div className="flex-1">
              {/* Day-of-week header */}
              <div className="grid grid-cols-7 border-l border-t border-zinc-200">
                {DOW.map((d, i) => (
                  <div
                    key={d}
                    className={`border-b border-r border-zinc-200 py-2 text-center text-xs font-medium ${
                      i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-zinc-500"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 border-l border-zinc-200">
                {calendarDays.map(({ date, isCurrentMonth }) => {
                  const ds = toDateStr(date);
                  const isToday = ds === today;
                  const isSelected = ds === selectedDate;
                  const daySched = scheduleMap.get(ds) ?? [];
                  const dayOfWeek = date.getDay();

                  return (
                    <div
                      key={ds}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleDateClick(ds)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleDateClick(ds); }}
                      className={`relative min-h-[80px] cursor-pointer border-b border-r border-zinc-200 p-1.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${
                        isSelected ? "bg-zinc-50" : "hover:bg-zinc-50/60"
                      } ${!isCurrentMonth ? "opacity-40" : ""}`}
                    >
                      {/* Date number */}
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          isToday
                            ? "bg-zinc-900 text-white"
                            : dayOfWeek === 0
                            ? "text-red-400"
                            : dayOfWeek === 6
                            ? "text-blue-400"
                            : "text-zinc-700"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {/* Schedule previews */}
                      <div className="mt-0.5 space-y-0.5">
                        {daySched.slice(0, 2).map((s) => (
                          <p
                            key={s.id}
                            className="truncate rounded bg-zinc-100 px-1 py-0.5 text-[10px] leading-tight text-zinc-700"
                          >
                            {s.title}
                          </p>
                        ))}
                        {daySched.length > 2 && (
                          <p className="px-1 text-[10px] text-zinc-400">
                            +{daySched.length - 2}개 더
                          </p>
                        )}
                      </div>

                      {/* Dot indicator when has schedules but only shows on very small cells */}
                      {daySched.length > 0 && (
                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-zinc-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Day panel ────────────────────────────────────────────────── */}
            <div className="w-full lg:w-72 lg:shrink-0">
              {selectedDate ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <h2 className="text-sm font-semibold text-zinc-900">
                      {formatSelectedDate(selectedDate)}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(null)}
                      aria-label="닫기"
                      className="shrink-0 text-zinc-400 hover:text-zinc-600"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
                      </svg>
                    </button>
                  </div>

                  {/* Add button */}
                  <button
                    type="button"
                    onClick={() => setModal({ type: "add", date: selectedDate })}
                    className="mb-4 w-full rounded-lg border border-dashed border-zinc-300 py-2 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
                  >
                    + 일정 추가
                  </button>

                  {/* Schedule list */}
                  {!isLoaded ? (
                    <p className="text-xs text-zinc-400">불러오는 중...</p>
                  ) : selectedSchedules.length === 0 ? (
                    <p className="text-xs text-zinc-400">등록된 일정이 없습니다.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedSchedules.map((s) => (
                        <li
                          key={s.id}
                          className="rounded-xl border border-zinc-100 bg-zinc-50 p-3"
                        >
                          <p className="text-sm font-medium text-zinc-900">{s.title}</p>
                          {s.description && (
                            <p className="mt-0.5 text-xs text-zinc-500">{s.description}</p>
                          )}
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setModal({ type: "edit", schedule: s })}
                              className="text-xs text-zinc-400 hover:text-zinc-700"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s.id)}
                              className="text-xs text-zinc-400 hover:text-red-600"
                            >
                              삭제
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-200 px-6 py-12 text-sm text-zinc-400">
                  날짜를 클릭하면 일정을 확인할 수 있습니다.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Modal */}
      {modal && (
        <ScheduleModal
          initialDate={modal.type === "add" ? modal.date : modal.schedule.date}
          initialSchedule={modal.type === "edit" ? modal.schedule : null}
          onClose={() => setModal(null)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}
