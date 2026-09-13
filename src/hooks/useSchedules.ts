"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Schedule {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  recurrenceId: string | null;
  reminderEnabled: boolean;
}

export type ScheduleInput = Omit<Schedule, "id" | "recurrenceId">;

export type RecurrenceFrequency = "daily" | "weekly";

export interface RecurrenceInput {
  frequency: RecurrenceFrequency;
  interval: number; // N일마다 / N주마다
  weekdays?: number[]; // 0=일..6=토, frequency==="weekly"일 때만 사용
  startDate: string;
  endDate: string;
}

const MAX_RECURRENCE_INSTANCES = 366;

interface ScheduleRow {
  id: string;
  title: string;
  description: string;
  date: string;
  recurrence_id: string | null;
  reminder_enabled: boolean;
}

function fromRow(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    recurrenceId: row.recurrence_id,
    reminderEnabled: row.reminder_enabled,
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

function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
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

// Expand a recurrence rule into the list of dates it produces (inclusive of start/end).
export function computeOccurrenceDates(rule: RecurrenceInput): string[] {
  const start = parseDateStr(rule.startDate);
  const end = parseDateStr(rule.endDate);
  const dates: string[] = [];

  if (rule.frequency === "daily") {
    const cur = new Date(start);
    while (cur <= end) {
      dates.push(toDateStr(cur));
      cur.setDate(cur.getDate() + rule.interval);
      if (dates.length > MAX_RECURRENCE_INSTANCES) break;
    }
  } else {
    const weekdays = new Set(rule.weekdays ?? []);
    const cur = new Date(start);
    while (cur <= end) {
      const daysSinceStart = Math.round((cur.getTime() - start.getTime()) / 86400000);
      const weekIndex = Math.floor(daysSinceStart / 7);
      if (weekdays.has(cur.getDay()) && weekIndex % rule.interval === 0) {
        dates.push(toDateStr(cur));
      }
      cur.setDate(cur.getDate() + 1);
      if (dates.length > MAX_RECURRENCE_INSTANCES) break;
    }
  }

  if (dates.length === 0) {
    throw new Error("선택한 조건에 해당하는 날짜가 없습니다.");
  }
  if (dates.length > MAX_RECURRENCE_INSTANCES) {
    throw new Error(
      `반복 횟수가 너무 많습니다(최대 ${MAX_RECURRENCE_INSTANCES}개). 종료일을 조정해주세요.`
    );
  }
  return dates;
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
      .select("id, title, description, date, recurrence_id, reminder_enabled")
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
        reminder_enabled: input.reminderEnabled,
      })
      .select("id, title, description, date, recurrence_id, reminder_enabled")
      .single();
    if (error) throw error;
    const newSchedule = fromRow(data as ScheduleRow);
    setSchedules((prev) => sortByDate([...prev, newSchedule]));
    return newSchedule;
  }, []);

  const addRecurringSchedule = useCallback(
    async (base: Omit<ScheduleInput, "date">, recurrence: RecurrenceInput) => {
      const dates = computeOccurrenceDates(recurrence);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("로그인이 필요합니다.");

      const { data: recurrenceRow, error: recurrenceError } = await supabase
        .from("schedule_recurrences")
        .insert({
          user_id: userId,
          frequency: recurrence.frequency,
          interval: recurrence.interval,
          weekdays: recurrence.frequency === "weekly" ? recurrence.weekdays : null,
          start_date: recurrence.startDate,
          end_date: recurrence.endDate,
        })
        .select("id")
        .single();
      if (recurrenceError) throw recurrenceError;

      const { error: insertError } = await supabase.from("schedules").insert(
        dates.map((date) => ({
          title: base.title,
          description: base.description,
          date,
          user_id: userId,
          recurrence_id: recurrenceRow.id,
          reminder_enabled: base.reminderEnabled,
        }))
      );
      if (insertError) throw insertError;

      await refresh();
    },
    [refresh]
  );

  const updateSchedule = useCallback(async (id: string, input: ScheduleInput) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("schedules")
      .update({
        title: input.title,
        description: input.description,
        date: input.date,
        reminder_enabled: input.reminderEnabled,
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

  const deleteRecurrence = useCallback(async (recurrenceId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("schedule_recurrences")
      .delete()
      .eq("id", recurrenceId);
    if (error) throw error;
    setSchedules((prev) => prev.filter((s) => s.recurrenceId !== recurrenceId));
  }, []);

  const getSchedulesByDate = useCallback(
    (date: string) => schedules.filter((s) => s.date === date),
    [schedules]
  );

  return {
    schedules,
    isLoaded,
    addSchedule,
    addRecurringSchedule,
    updateSchedule,
    deleteSchedule,
    deleteRecurrence,
    getSchedulesByDate,
  };
}
