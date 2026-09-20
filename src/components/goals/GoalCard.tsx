"use client";

import type { Goal } from "@/hooks/useGoals";

interface GoalRowProps {
  goal: Goal;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** 예정된 일목표(마감일이 오늘 이후)일 때 마감일 대신 보여줄 라벨. 지정하면 흐린 스타일 + 체크 비활성 */
  upcomingLabel?: string;
}

const chipClass =
  "rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200";

export default function GoalCard({
  goal,
  onToggle,
  onEdit,
  onDelete,
  upcomingLabel,
}: GoalRowProps) {
  const isUpcoming = upcomingLabel !== undefined;

  return (
    <div
      className={`group flex items-center gap-4 rounded-2xl px-5 py-4 transition-colors ${
        isUpcoming
          ? "bg-zinc-50/60 ring-1 ring-inset ring-zinc-100"
          : "bg-zinc-50 hover:bg-zinc-100/70"
      }`}
    >
      {/* Toggle circle */}
      <button
        type="button"
        onClick={onToggle}
        disabled={isUpcoming}
        aria-label={goal.isCompleted ? "미달성으로 변경" : "달성으로 변경"}
        title={isUpcoming ? "예정된 목표는 그날이 되면 체크할 수 있어요" : undefined}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
          goal.isCompleted
            ? "border-zinc-900 bg-zinc-900 text-white"
            : isUpcoming
              ? "cursor-not-allowed border-dashed border-zinc-300"
              : "border-zinc-300 bg-white hover:border-zinc-900"
        }`}
      >
        {goal.isCompleted && (
          <svg
            width="11"
            height="11"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 5l2.5 2.5 4.5-4.5" />
          </svg>
        )}
      </button>

      {/* Title */}
      <p
        className={`min-w-0 flex-1 truncate text-[15px] font-medium ${
          goal.isCompleted
            ? "text-zinc-400 line-through"
            : isUpcoming
              ? "text-zinc-500"
              : "text-zinc-900"
        }`}
      >
        {goal.title}
      </p>

      {/* Category + recurring + deadline (hidden on very small screens) */}
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <span className={chipClass}>{goal.category}</span>
        {goal.recurringTemplateId !== null && <span className={chipClass}>↻ 반복</span>}
        <span className="min-w-[4.5rem] text-right text-xs tabular-nums text-zinc-400">
          {isUpcoming ? upcomingLabel : `~${goal.deadline}`}
        </span>
      </div>

      {/* Actions: 데스크톱에선 hover/포커스 때만 보이고, 터치 화면에선 항상 보임 */}
      <div className="flex shrink-0 gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          aria-label="수정"
          title="수정"
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white hover:text-zinc-800"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.3 2.3a1.5 1.5 0 0 1 2.1 2.1l-7.6 7.6-2.6.6.6-2.6 7.5-7.7z"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="삭제"
          title="삭제"
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white hover:text-red-600"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.5 4h11M6 4V2.8c0-.4.3-.8.8-.8h2.4c.5 0 .8.4.8.8V4M4 4l.6 8.4c0 .9.7 1.6 1.6 1.6h3.6c.9 0 1.6-.7 1.6-1.6L12 4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
