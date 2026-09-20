"use client";

import { useEffect, useState } from "react";
import type { Goal, GoalCategory, GoalInput } from "@/hooks/useGoals";
import { useBackdropClose } from "@/hooks/useBackdropClose";

const categoryOptions: GoalCategory[] = ["일목표", "주목표", "연목표"];
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

interface GoalModalProps {
  initialGoal?: Goal | null;
  onClose: () => void;
  onSubmit: (input: GoalInput, weekdays?: number[]) => void;
}

export default function GoalModal({ initialGoal, onClose, onSubmit }: GoalModalProps) {
  const isEdit = !!initialGoal;

  const [title, setTitle] = useState(initialGoal?.title ?? "");
  const [description, setDescription] = useState(initialGoal?.description ?? "");
  const [category, setCategory] = useState<GoalCategory>(
    initialGoal?.category ?? "일목표"
  );
  const [deadline, setDeadline] = useState(initialGoal?.deadline ?? "");
  const [isRecurring, setIsRecurring] = useState(false); // 새 목표 추가 시에만
  const [weekdays, setWeekdays] = useState<number[]>(ALL_WEEKDAYS);
  const [weekdayError, setWeekdayError] = useState("");
  const backdropProps = useBackdropClose(onClose);

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleCategoryChange = (cat: GoalCategory) => {
    setCategory(cat);
    if (cat !== "일목표") setIsRecurring(false);
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
    // 반복 목표는 deadline 불필요 (오늘 날짜로 자동 생성)
    if (!isRecurring && !deadline) return;
    setWeekdayError("");
    if (isRecurring && weekdays.length === 0) {
      setWeekdayError("요일을 하나 이상 선택해주세요.");
      return;
    }
    onSubmit(
      { title, description, category, deadline, isRecurring },
      isRecurring ? weekdays : undefined
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      {...backdropProps}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-zinc-900">
          {isEdit ? "목표 수정" : "목표 추가"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              spellCheck={false}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              spellCheck={false}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
            />
          </div>

          {/* 카테고리 + 마감일 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-zinc-700">카테고리</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as GoalCategory)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            {/* 반복 ON이면 마감일 숨김 */}
            {!isRecurring && (
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-zinc-700">마감일</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 반복 토글 — 새 일목표 추가 시에만 표시 */}
          {!isEdit && category === "일목표" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">반복</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecurring(false)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    !isRecurring
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  없음
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecurring(true)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    isRecurring
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  반복
                </button>
              </div>
              {isRecurring && (
                <div className="mt-3 space-y-1.5">
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
                  {weekdayError && (
                    <p className="text-xs text-red-600">{weekdayError}</p>
                  )}
                  <p className="text-xs text-zinc-400">
                    선택한 요일에 오늘 날짜로 자동 생성됩니다.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
