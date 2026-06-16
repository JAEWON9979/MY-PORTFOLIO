"use client";

import type { GoalCategory } from "@/hooks/useGoals";

export type CategoryFilterValue = "전체" | GoalCategory;

const categories: CategoryFilterValue[] = ["전체", "단기", "장기", "학업"];

interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

export default function CategoryFilter({
  value,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isActive = category === value;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
