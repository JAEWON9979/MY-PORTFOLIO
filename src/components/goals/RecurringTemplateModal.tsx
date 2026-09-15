"use client";

import { useEffect, useState } from "react";
import type { RecurringTemplate } from "@/hooks/useRecurringTemplates";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface RecurringTemplateModalProps {
  template: RecurringTemplate;
  onClose: () => void;
  onSubmit: (title: string, weekdays: number[]) => void;
}

export default function RecurringTemplateModal({
  template,
  onClose,
  onSubmit,
}: RecurringTemplateModalProps) {
  const [title, setTitle] = useState(template.title);
  const [weekdays, setWeekdays] = useState<number[]>(template.weekdays);
  const [weekdayError, setWeekdayError] = useState("");

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (weekdays.length === 0) {
      setWeekdayError("요일을 하나 이상 선택해주세요.");
      return;
    }
    setWeekdayError("");
    onSubmit(title, weekdays);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-zinc-900">반복 목표 수정</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">반복 요일</label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_LABELS.map((label, day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    weekdays.includes(day)
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {weekdayError && <p className="mt-1.5 text-xs text-red-600">{weekdayError}</p>}
            <p className="mt-1.5 text-xs text-zinc-400">
              선택한 요일에만 오늘 날짜로 자동 생성됩니다. 이미 생성된 목표는 바뀌지 않습니다.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
