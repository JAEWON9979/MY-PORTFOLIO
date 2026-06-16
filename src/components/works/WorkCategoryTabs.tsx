"use client";

import type { WorkCategory } from "@/hooks/useWorks";

export type WorkCategoryFilterValue = "전체" | WorkCategory;

const categories: WorkCategoryFilterValue[] = [
  "전체",
  "수업과제",
  "개인실습",
  "팀프로젝트",
];

interface WorkCategoryTabsProps {
  value: WorkCategoryFilterValue;
  onChange: (value: WorkCategoryFilterValue) => void;
}

export default function WorkCategoryTabs({
  value,
  onChange,
}: WorkCategoryTabsProps) {
  return (
    <div className="flex gap-6 border-b border-zinc-200">
      {categories.map((category) => {
        const isActive = category === value;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`-mb-px border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
