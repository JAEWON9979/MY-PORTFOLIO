"use client";

import { useEffect, useState } from "react";
import type { Goal, GoalCategory, GoalInput } from "@/hooks/useGoals";

const categoryOptions: GoalCategory[] = ["일목표", "주목표", "연목표"];

interface GoalModalProps {
  initialGoal?: Goal | null;
  onClose: () => void;
  onSubmit: (input: GoalInput) => void;
}

export default function GoalModal({ initialGoal, onClose, onSubmit }: GoalModalProps) {
  const [title, setTitle] = useState(initialGoal?.title ?? "");
  const [description, setDescription] = useState(initialGoal?.description ?? "");
  const [category, setCategory] = useState<GoalCategory>(
    initialGoal?.category ?? "일목표"
  );
  const [deadline, setDeadline] = useState(initialGoal?.deadline ?? "");
  const [isRecurring, setIsRecurring] = useState(initialGoal?.isRecurring ?? false);

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
    if (!title.trim() || !deadline) return;
    onSubmit({ title, description, category, deadline, isRecurring });
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
          {initialGoal ? "목표 수정" : "목표 추가"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                카테고리
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as GoalCategory)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                마감일
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Recurring toggle — 일목표 only */}
          {category === "일목표" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                반복
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecurring(false)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    !isRecurring
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  없음
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecurring(true)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isRecurring
                      ? "bg-sky-600 text-white"
                      : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  매일 반복
                </button>
              </div>
              {isRecurring && (
                <p className="mt-1.5 text-xs text-zinc-400">
                  /goals 페이지 진입 시 오늘 날짜로 자동 생성됩니다.
                </p>
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
