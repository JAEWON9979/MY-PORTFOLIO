"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type GoalCategory = "일목표" | "주목표" | "연목표";

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  isCompleted: boolean;
  deadline: string;
  isRecurring: boolean;
  recurringTemplateId: string | null;
}

// recurringTemplateId is set internally when spawning instances, not by the user
export type GoalInput = Omit<Goal, "id" | "isCompleted" | "recurringTemplateId">;

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
    isRecurring: row.is_recurring,
    recurringTemplateId: row.recurring_template_id,
  };
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
        is_recurring: input.isRecurring,
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
        is_recurring: input.isRecurring,
      })
      .eq("id", id);
    if (error) throw error;
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, ...input } : goal))
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

  // Called on page entry: for each recurring template, create today's instance if missing.
  const spawnRecurringInstances = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const templates = goals.filter((g) => g.isRecurring && g.recurringTemplateId === null);
    if (templates.length === 0) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const spawned: Goal[] = [];
    for (const tpl of templates) {
      // Template itself covers today — no spawn needed
      if (tpl.deadline === today) continue;
      // Instance for today already exists in local state
      const exists = goals.some(
        (g) => g.recurringTemplateId === tpl.id && g.deadline === today
      );
      if (exists) continue;

      const { data, error } = await supabase
        .from("goals")
        .insert({
          title: tpl.title,
          description: tpl.description,
          category: tpl.category,
          deadline: today,
          is_recurring: false,
          recurring_template_id: tpl.id,
          user_id: userId,
        })
        .select()
        .single();
      if (!error && data) spawned.push(fromRow(data as GoalRow));
    }
    if (spawned.length > 0) {
      setGoals((prev) => [...spawned, ...prev]);
    }
  }, [goals]);

  return {
    goals,
    isLoaded,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleComplete,
    spawnRecurringInstances,
  };
}
