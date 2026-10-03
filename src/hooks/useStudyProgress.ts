"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { daysBetween, kstToday } from "@/lib/date";

// 0 = 안 함, 1 = 수업만 들음, 2 = 복습 완료 (0은 DB에 행이 없는 상태)
export type StudyStatus = 0 | 1 | 2;

export interface StudyTerm {
  id: string;
  label: string;
  startDate: string; // YYYY-MM-DD, 1주차 시작일
  midtermWeek: number;
  finalWeek: number;
}

export type StudyTermInput = Omit<StudyTerm, "id">;

export interface StudyCourse {
  id: string;
  termId: string;
  name: string;
}

interface TermRow {
  id: string;
  label: string;
  start_date: string;
  midterm_week: number;
  final_week: number;
}

interface ProgressRow {
  course_id: string;
  week: number;
  status: 1 | 2;
}

function termFromRow(row: TermRow): StudyTerm {
  return {
    id: row.id,
    label: row.label,
    startDate: row.start_date,
    midtermWeek: row.midterm_week,
    finalWeek: row.final_week,
  };
}

function termToRow(input: StudyTermInput) {
  return {
    label: input.label,
    start_date: input.startDate,
    midterm_week: input.midtermWeek,
    final_week: input.finalWeek,
  };
}

// 시작일 기준 오늘이 몇 주차인지 (시작 전이면 0)
export function currentWeekOf(term: StudyTerm): number {
  const diff = daysBetween(kstToday(), term.startDate);
  return diff < 0 ? 0 : Math.floor(diff / 7) + 1;
}

// n주차의 시작일 (YYYY-MM-DD)
export function weekStartDate(term: StudyTerm, week: number): string {
  const [y, m, d] = term.startDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + (week - 1) * 7)).toISOString().slice(0, 10);
}

export const progressKey = (courseId: string, week: number) => `${courseId}:${week}`;

export function useStudyProgress() {
  const [terms, setTerms] = useState<StudyTerm[]>([]);
  const [courses, setCourses] = useState<StudyCourse[]>([]);
  // key: progressKey(courseId, week)
  const [progress, setProgress] = useState<Record<string, StudyStatus>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const [termsRes, coursesRes, progressRes] = await Promise.all([
      supabase.from("study_terms").select("*").order("start_date", { ascending: false }),
      supabase.from("study_courses").select("*").order("created_at", { ascending: true }),
      supabase.from("study_progress").select("course_id, week, status"),
    ]);
    if (!termsRes.error && termsRes.data) {
      setTerms((termsRes.data as TermRow[]).map(termFromRow));
    }
    if (!coursesRes.error && coursesRes.data) {
      setCourses(
        (coursesRes.data as { id: string; term_id: string; name: string }[]).map((r) => ({
          id: r.id,
          termId: r.term_id,
          name: r.name,
        })),
      );
    }
    if (!progressRes.error && progressRes.data) {
      const map: Record<string, StudyStatus> = {};
      (progressRes.data as ProgressRow[]).forEach((r) => {
        map[progressKey(r.course_id, r.week)] = r.status;
      });
      setProgress(map);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTerm = useCallback(async (input: StudyTermInput) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("study_terms")
      .insert(termToRow(input))
      .select()
      .single();
    if (error) throw error;
    const term = termFromRow(data as TermRow);
    setTerms((prev) =>
      [...prev, term].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    );
    return term;
  }, []);

  const updateTerm = useCallback(async (id: string, input: StudyTermInput) => {
    const supabase = createClient();
    const { error } = await supabase.from("study_terms").update(termToRow(input)).eq("id", id);
    if (error) throw error;
    setTerms((prev) =>
      prev
        .map((t) => (t.id === id ? { ...t, ...input } : t))
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    );
  }, []);

  const deleteTerm = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("study_terms").delete().eq("id", id);
    if (error) throw error;
    setTerms((prev) => prev.filter((t) => t.id !== id));
    setCourses((prev) => prev.filter((c) => c.termId !== id));
  }, []);

  const addCourse = useCallback(async (termId: string, name: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("study_courses")
      .insert({ term_id: termId, name })
      .select()
      .single();
    if (error) throw error;
    const row = data as { id: string; term_id: string; name: string };
    setCourses((prev) => [...prev, { id: row.id, termId: row.term_id, name: row.name }]);
  }, []);

  const renameCourse = useCallback(async (id: string, name: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("study_courses").update({ name }).eq("id", id);
    if (error) throw error;
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }, []);

  const deleteCourse = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("study_courses").delete().eq("id", id);
    if (error) throw error;
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // 화면을 먼저 바꾸고 저장, 실패하면 이전 상태로 되돌린다.
  const setStatus = useCallback(
    async (courseId: string, week: number, status: StudyStatus, prevStatus: StudyStatus) => {
      const key = progressKey(courseId, week);
      setProgress((prev) => ({ ...prev, [key]: status }));
      const supabase = createClient();
      const { error } =
        status === 0
          ? await supabase
              .from("study_progress")
              .delete()
              .eq("course_id", courseId)
              .eq("week", week)
          : await supabase
              .from("study_progress")
              .upsert({ course_id: courseId, week, status, updated_at: new Date().toISOString() });
      if (error) {
        setProgress((prev) => ({ ...prev, [key]: prevStatus }));
        throw error;
      }
    },
    [],
  );

  return {
    terms,
    courses,
    progress,
    isLoaded,
    refresh,
    addTerm,
    updateTerm,
    deleteTerm,
    addCourse,
    renameCourse,
    deleteCourse,
    setStatus,
  };
}
