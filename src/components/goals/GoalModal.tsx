"use client";

import { useEffect, useState } from "react";
import type { Goal, GoalCategory, GoalInput } from "@/hooks/useGoals";

const categoryOptions: GoalCategory[] = ["단기", "장기", "학업"];

interface GoalModalProps {
  initialGoal?: Goal | null;
  onClose: () => void;
  onSubmit: (input: GoalInput) => void;
}

export default function GoalModal({
  initialGoal,
  onClose,
  onSubmit,
}: GoalModalProps) {
  const [title, setTitle] = useState(initialGoal?.title ?? "");
  const [description, setDescription] = useState(
    initialGoal?.description ?? ""
  );
  const [category, setCategory] = useState<GoalCategory>(
    initialGoal?.category ?? "단기"
  );
  const [deadline, setDeadline] = useState(initialGoal?.deadline ?? "");
  const [progress, setProgress] = useState(initialGoal?.progress ?? 0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !deadline) return;
    onSubmit({ title, description, category, deadline, progress });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
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
              onChange={(event) => setTitle(event.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              설명
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
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
                onChange={(event) =>
                  setCategory(event.target.value as GoalCategory)
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
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
                onChange={(event) => setDeadline(event.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 flex justify-between text-sm font-medium text-zinc-700">
              <span>진행률</span>
              <span>{progress}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
              className="w-full"
            />
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
