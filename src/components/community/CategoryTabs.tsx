"use client";

import type { PostCategory } from "@/hooks/usePosts";

export type CategoryFilterValue = "전체" | PostCategory;

const categories: CategoryFilterValue[] = ["전체", "자유", "정보공유", "질문"];

interface CategoryTabsProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

export default function CategoryTabs({ value, onChange }: CategoryTabsProps) {
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
