"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { kstToday } from "@/lib/date";

export type GoalCategory = "일목표" | "주목표" | "연목표";

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  isCompleted: boolean;
  deadline: string;
  recurringTemplateId: string | null;
}

export interface GoalInput {
  title: string;
  description: string;
  category: GoalCategory;
  deadline: string;
  isRecurring: boolean; // 페이지에서 라우팅에만 사용, DB에는 저장 안 함
}

interface GoalRow {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  is_completed: boolean;
  deadline: string;
  is_recurring: boolean;
  recurring_template_id: string | null;
}

function fromRow(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    isCompleted: row.is_completed,
    deadline: row.deadline,
    recurringTemplateId: row.recurring_template_id,
  };
}

// recurring_templates 목록을 받아, 오늘이 선택된 요일이면서 아직 없는 인스턴스만 생성
export async function spawnTodayInstances(
  templates: { id: string; title: string; weekdays: number[] }[],
  userId: string
): Promise<Goal[]> {
  if (!templates.length || !userId) return [];
  const supabase = createClient();
  const today = kstToday();
  const [ty, tm, td] = today.split("-").map(Number);
  const todayWeekday = new Date(ty, tm - 1, td).getDay();
  templates = templates.filter((tpl) => tpl.weekdays.includes(todayWeekday));
  if (!templates.length) return [];

  // 오늘 이미 생성된 인스턴스의 template id 수집
  const { data: existing } = await supabase
    .from("goals")
    .select("recurring_template_id")
    .eq("user_id", userId)
    .eq("deadline", today)
    .not("recurring_template_id", "is", null);

  const existingIds = new Set(
    (existing ?? []).map(
      (g: { recurring_template_id: string }) => g.recurring_template_id
    )
  );

  const spawned: Goal[] = [];
  for (const tpl of templates) {
    if (existingIds.has(tpl.id)) continue;
    const { data, error } = await supabase
      .from("goals")
      .insert({
        title: tpl.title,
        description: "",
        category: "일목표",
        deadline: today,
        is_recurring: false,
        recurring_template_id: tpl.id,
        user_id: userId,
      })
      .select()
      .single();
    if (!error && data) spawned.push(fromRow(data as GoalRow));
  }
  return spawned;
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setGoals((data as GoalRow[]).map(fromRow));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addGoal = useCallback(async (input: GoalInput) => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error("로그인이 필요합니다.");
    const { data, error } = await supabase
      .from("goals")
      .insert({
        title: input.title,
        description: input.description,
        category: input.category,
        deadline: input.deadline,
        is_recurring: false,
        user_id: userId,
      })
      .select()
      .single();
    if (error) throw error;
    const newGoal = fromRow(data as GoalRow);
    setGoals((prev) => [newGoal, ...prev]);
    return newGoal;
  }, []);

  const updateGoal = useCallback(async (id: string, input: GoalInput) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("goals")
      .update({
        title: input.title,
        description: input.description,
        category: input.category,
        deadline: input.deadline,
      })
      .eq("id", id);
    if (error) throw error;
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === id ? { ...goal, ...input } : goal
      )
    );
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) throw error;
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  }, []);

  const toggleComplete = useCallback(
    async (id: string) => {
      const current = goals.find((g) => g.id === id);
      if (!current) return;
      const next = !current.isCompleted;
      const supabase = createClient();
      const { error } = await supabase
        .from("goals")
        .update({ is_completed: next })
        .eq("id", id);
      if (error) return;
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isCompleted: next } : g))
      );
    },
    [goals]
  );

  return {
    goals,
    isLoaded,
    refresh,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleComplete,
  };
}
