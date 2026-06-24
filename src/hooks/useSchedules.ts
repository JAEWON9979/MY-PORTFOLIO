"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Schedule {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
}

export type ScheduleInput = Omit<Schedule, "id">;

interface ScheduleRow {
  id: string;
  title: string;
  description: string;
  date: string;
}

function fromRow(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
  };
}

function sortByDate(list: Schedule[]): Schedule[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date));
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Fetch the calendar-visible range: the grid can show up to 6 days of prev/next month.
function calendarRange(year: number, month: number): { start: string; end: string } {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = new Date(first);
  start.setDate(start.getDate() - 6);
  const end = new Date(last);
  end.setDate(end.getDate() + 6);
  return { start: toDateStr(start), end: toDateStr(end) };
}

// year/month (0-indexed) drive the query range so only the visible calendar window is fetched.
export function useSchedules(year: number, month: number) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const { start, end } = calendarRange(year, month);
    setIsLoaded(false);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("schedules")
      .select("id, title, description, date")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });
    if (!error && data) {
      setSchedules((data as ScheduleRow[]).map(fromRow));
    }
    setIsLoaded(true);
  }, [year, month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addSchedule = useCallback(async (input: ScheduleInput) => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error("로그인이 필요합니다.");
    const { data, error } = await supabase
      .from("schedules")
      .insert({
        title: input.title,
        description: input.description,
        date: input.date,
        user_id: userId,
      })
      .select("id, title, description, date")
      .single();
    if (error) throw error;
    const newSchedule = fromRow(data as ScheduleRow);
    setSchedules((prev) => sortByDate([...prev, newSchedule]));
    return newSchedule;
  }, []);

  const updateSchedule = useCallback(async (id: string, input: ScheduleInput) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("schedules")
      .update({
        title: input.title,
        description: input.description,
        date: input.date,
      })
      .eq("id", id);
    if (error) throw error;
    setSchedules((prev) =>
      sortByDate(prev.map((s) => (s.id === id ? { ...s, ...input } : s)))
    );
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (error) throw error;
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getSchedulesByDate = useCallback(
    (date: string) => schedules.filter((s) => s.date === date),
    [schedules]
  );

  return {
    schedules,
    isLoaded,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedulesByDate,
  };
}
