"use client";

import SegmentedControl from "@/components/ui/SegmentedControl";
import type { GoalCategory } from "@/hooks/useGoals";

export type CategoryFilterValue = "전체" | GoalCategory;

const categories: CategoryFilterValue[] = ["전체", "일목표", "주목표", "월목표", "연목표"];

interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

export default function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return <SegmentedControl options={categories} value={value} onChange={onChange} />;
}
