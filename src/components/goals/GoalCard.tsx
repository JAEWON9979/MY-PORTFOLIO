"use client";

import type { Goal } from "@/hooks/useGoals";

interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onProgressChange: (progress: number) => void;
}

const categoryStyles: Record<Goal["category"], string> = {
  단기: "bg-blue-50 text-blue-700",
  장기: "bg-purple-50 text-purple-700",
  학업: "bg-amber-50 text-amber-700",
};

export default function GoalCard({
  goal,
  onEdit,
  onDelete,
  onProgressChange,
}: GoalCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${categoryStyles[goal.category]}`}
        >
          {goal.category}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            수정
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600"
          >
            삭제
          </button>
        </div>
      </div>

      <h3 className="text-base font-semibold text-zinc-900">{goal.title}</h3>
      <p className="mt-1 flex-1 text-sm text-zinc-600">{goal.description}</p>
      <p className="mt-3 text-xs text-zinc-500">마감일 {goal.deadline}</p>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs font-medium text-zinc-600">
          <span>진행률</span>
          <span>{goal.progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={goal.progress}
          onChange={(event) => onProgressChange(Number(event.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
