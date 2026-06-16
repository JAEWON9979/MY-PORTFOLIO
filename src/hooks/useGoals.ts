"use client";

import { useCallback, useEffect, useState } from "react";

export type GoalCategory = "단기" | "장기" | "학업";

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  progress: number;
  deadline: string;
}

export type GoalInput = Omit<Goal, "id">;

const STORAGE_KEY = "goals";

const sampleGoals: Goal[] = [
  {
    id: "sample-1",
    title: "정보처리기사 자격증 취득",
    description: "필기/실기 일정에 맞춰 매일 1시간씩 학습하기.",
    category: "학업",
    progress: 40,
    deadline: "2026-09-30",
  },
  {
    id: "sample-2",
    title: "행정 직무 포트폴리오 완성",
    description: "경력, 역량을 정리해 지원 가능한 포트폴리오 페이지 만들기.",
    category: "단기",
    progress: 70,
    deadline: "2026-07-15",
  },
  {
    id: "sample-3",
    title: "공공기관 행정 직무 취업",
    description: "관련 공고를 꾸준히 지원하고 면접 준비하기.",
    category: "장기",
    progress: 15,
    deadline: "2027-03-01",
  },
];

function loadGoals(): Goal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleGoals;
    return JSON.parse(raw) as Goal[];
  } catch {
    return sampleGoals;
  }
}

function persistGoals(goals: Goal[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setGoals(loadGoals());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) persistGoals(goals);
  }, [goals, isLoaded]);

  const addGoal = useCallback(async (input: GoalInput) => {
    const newGoal: Goal = { ...input, id: crypto.randomUUID() };
    setGoals((prev) => [newGoal, ...prev]);
    return newGoal;
  }, []);

  const updateGoal = useCallback(async (id: string, input: GoalInput) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, ...input } : goal))
    );
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  }, []);

  const updateProgress = useCallback(async (id: string, progress: number) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, progress } : goal))
    );
  }, []);

  return { goals, isLoaded, addGoal, updateGoal, deleteGoal, updateProgress };
}
