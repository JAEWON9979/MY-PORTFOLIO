"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface RecurringTemplate {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  weekdays: number[]; // 0=일..6=토, 생성될 요일
}

interface TemplateRow {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  weekdays: number[];
}

function fromRow(row: TemplateRow): RecurringTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    weekdays: row.weekdays,
  };
}

export function useRecurringTemplates() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      setIsLoaded(true);
      return;
    }
    const { data, error } = await supabase
      .from("recurring_templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (!error && data) setTemplates((data as TemplateRow[]).map(fromRow));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTemplate = useCallback(
    async (title: string, weekdays: number[]): Promise<RecurringTemplate> => {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error("로그인이 필요합니다.");
      const { data, error } = await supabase
        .from("recurring_templates")
        .insert({ user_id: userId, title, weekdays })
        .select()
        .single();
      if (error) throw error;
      const tpl = fromRow(data as TemplateRow);
      setTemplates((prev) => [...prev, tpl]);
      return tpl;
    },
    []
  );

  const deleteTemplate = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("recurring_templates")
      .delete()
      .eq("id", id);
    if (error) throw error;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { templates, isLoaded, addTemplate, deleteTemplate, refresh };
}
