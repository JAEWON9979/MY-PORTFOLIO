"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

interface GoalRow {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  progress: number;
  deadline: string;
}

function fromRow(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    progress: row.progress,
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
    const { data, error } = await supabase
      .from("goals")
      .insert({
        title: input.title,
        description: input.description,
        category: input.category,
        progress: input.progress,
        deadline: input.deadline,
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
        progress: input.progress,
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

  const updateProgress = useCallback(async (id: string, progress: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("goals")
      .update({ progress })
      .eq("id", id);
    if (error) return;
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, progress } : goal))
    );
  }, []);

  return { goals, isLoaded, addGoal, updateGoal, deleteGoal, updateProgress };
}
