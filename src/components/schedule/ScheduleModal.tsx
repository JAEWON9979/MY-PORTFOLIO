"use client";

import { useEffect, useState } from "react";
import type { Schedule, ScheduleInput, RecurrenceInput } from "@/hooks/useSchedules";

interface ScheduleModalProps {
  initialDate: string;
  initialSchedule?: Schedule | null;
  onClose: () => void;
  onSubmit: (input: ScheduleInput, recurrence?: RecurrenceInput) => void;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ScheduleModal({
  initialDate,
  initialSchedule,
  onClose,
  onSubmit,
}: ScheduleModalProps) {
  const [title, setTitle] = useState(initialSchedule?.title ?? "");
  const [description, setDescription] = useState(initialSchedule?.description ?? "");
  const [date, setDate] = useState(initialSchedule?.date ?? initialDate);
  const [reminderEnabled, setReminderEnabled] = useState(
    initialSchedule?.reminderEnabled ?? true
  );

  const isAddMode = !initialSchedule;
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly">("weekly");
  const [interval, setInterval] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [endDate, setEndDate] = useState("");
  const [recurrenceError, setRecurrenceError] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setRecurrenceError("");

    if (isAddMode && isRecurring) {
      if (!endDate || endDate < date) {
        setRecurrenceError("종료일은 시작일 이후여야 합니다.");
        return;
      }
      if (frequency === "weekly" && weekdays.length === 0) {
        setRecurrenceError("요일을 하나 이상 선택해주세요.");
        return;
      }
      onSubmit(
        { title, description, date, reminderEnabled },
        {
          frequency,
          interval,
          weekdays: frequency === "weekly" ? weekdays : undefined,
          startDate: date,
          endDate,
        }
      );
      return;
    }

    onSubmit({ title, description, date, reminderEnabled });
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
        <h2 className="mb-4 text-lg font-bold text-zinc-900">
          {initialSchedule ? "일정 수정" : "일정 추가"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              날짜
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              제목
            </label>
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
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              하루 전 이메일 알림 받기
            </label>
          </div>

          {isAddMode && (
            <div className="rounded-lg border border-zinc-200 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                반복 설정
              </label>

              {isRecurring && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as "daily" | "weekly")}
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                    >
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={interval}
                      onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                    />
                    <span className="text-sm text-zinc-600">
                      {frequency === "daily" ? "일마다" : "주마다"}
                    </span>
                  </div>

                  {frequency === "weekly" && (
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
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                      종료일
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={date}
                      onChange={(e) => setEndDate(e.target.value)}
                      required={isRecurring}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>

                  {recurrenceError && (
                    <p className="text-xs text-red-600">{recurrenceError}</p>
                  )}
                </div>
              )}
            </div>
          )}

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
