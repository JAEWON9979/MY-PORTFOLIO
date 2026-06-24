"use client";

import type { Goal } from "@/hooks/useGoals";

interface GoalRowProps {
  goal: Goal;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const categoryStyles: Record<Goal["category"], string> = {
  일목표: "bg-sky-50 text-sky-700",
  주목표: "bg-violet-50 text-violet-700",
  연목표: "bg-amber-50 text-amber-700",
};

export default function GoalCard({ goal, onToggle, onEdit, onDelete }: GoalRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-shadow hover:shadow-sm">
      {/* Toggle circle */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={goal.isCompleted ? "미달성으로 변경" : "달성으로 변경"}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          goal.isCompleted
            ? "border-zinc-900 bg-zinc-900 text-white"
            : "border-zinc-300 hover:border-zinc-600"
        }`}
      >
        {goal.isCompleted && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 5l2.5 2.5 4.5-4.5" />
          </svg>
        )}
      </button>

      {/* Title */}
      <p
        className={`flex-1 truncate text-sm font-medium ${
          goal.isCompleted ? "text-zinc-400 line-through" : "text-zinc-900"
        }`}
      >
        {goal.title}
      </p>

      {/* Category + recurring + deadline (hidden on very small screens) */}
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyles[goal.category]}`}
        >
          {goal.category}
        </span>
        {goal.isRecurring && goal.recurringTemplateId === null && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
            반복
          </span>
        )}
        <span className="text-xs text-zinc-400">~{goal.deadline}</span>
      </div>

      {/* Status pill */}
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          goal.isCompleted
            ? "bg-emerald-50 text-emerald-700"
            : "bg-zinc-100 text-zinc-500"
        }`}
      >
        {goal.isCompleted ? "달성" : "미달성"}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded px-1.5 py-1 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          수정
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded px-1.5 py-1 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-600"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
