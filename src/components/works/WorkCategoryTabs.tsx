"use client";

import SegmentedControl from "@/components/ui/SegmentedControl";
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
  return <SegmentedControl options={categories} value={value} onChange={onChange} />;
}
