"use client";

import type { GoalCategory } from "@/hooks/useGoals";

export type CategoryFilterValue = "전체" | GoalCategory;

const categories: CategoryFilterValue[] = ["전체", "일목표", "주목표", "연목표"];

interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

export default function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full bg-zinc-100 p-1">
      {categories.map((category) => {
        const isActive = category === value;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            aria-pressed={isActive}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
