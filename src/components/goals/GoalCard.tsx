"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RowActions from "@/components/ui/RowActions";
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
  const [expanded, setExpanded] = useState(false);
  const hasDescription = goal.description.trim().length > 0;

  return (
    <div
      className={`group overflow-hidden rounded-2xl transition-colors ${
        isUpcoming
          ? "bg-zinc-50/60 ring-1 ring-inset ring-zinc-100"
          : "bg-zinc-50 hover:bg-zinc-100/70"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        aria-expanded={expanded}
        className="flex cursor-pointer items-center gap-4 px-5 py-4"
      >
        {/* Toggle circle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
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

        {/* Expand chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className={`shrink-0 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5L6 8l3.5-3.5" />
        </svg>

        <div onClick={(e) => e.stopPropagation()}>
          <RowActions onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="whitespace-pre-wrap px-5 pb-4 text-sm leading-relaxed text-zinc-600">
              {hasDescription ? goal.description : "설명이 없습니다."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
