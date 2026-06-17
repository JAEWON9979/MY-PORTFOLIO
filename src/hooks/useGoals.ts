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
}

export type GoalInput = Omit<Goal, "id" | "isCompleted">;

interface GoalRow {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  is_completed: boolean;
  deadline: string;
}

function fromRow(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    isCompleted: row.is_completed,
    deadline: row.deadline,
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

  return { goals, isLoaded, addGoal, updateGoal, deleteGoal, toggleComplete };
}
