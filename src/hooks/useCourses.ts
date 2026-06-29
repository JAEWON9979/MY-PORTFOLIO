"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CourseGrade = "A+" | "A0" | "B+" | "B0" | "C+" | "C0" | "D+" | "D0" | "F" | "P";
export type CourseCategory = "계공" | "교필" | "교선" | "전공";
export type CourseSemester = "1학기" | "2학기";

export interface Course {
  id: string;
  name: string;
  credit: number;
  grade: CourseGrade;
  category: CourseCategory;
  year: number;
  semester: CourseSemester;
}

export type CourseInput = Omit<Course, "id">;

interface CourseRow {
  id: string;
  name: string;
  credit: number;
  grade: CourseGrade;
  category: CourseCategory;
  year: number;
  semester: CourseSemester;
  created_at: string;
}

export const GRADE_POINTS: Record<CourseGrade, number> = {
  "A+": 4.5, "A0": 4.0, "B+": 3.5, "B0": 3.0,
  "C+": 2.5, "C0": 2.0, "D+": 1.5, "D0": 1.0, "F": 0.0, "P": 0.0,
};

export const GRADE_OPTIONS: CourseGrade[] = [
  "A+", "A0", "B+", "B0", "C+", "C0", "D+", "D0", "F", "P",
];

export const CATEGORY_OPTIONS: CourseCategory[] = ["계공", "교필", "교선", "전공"];

// P 성적 및 0학점 과목은 평점 계산에서 제외
export function calcGPA(courses: Course[]): number {
  const graded = courses.filter((c) => c.grade !== "P" && c.credit > 0);
  const totalCredit = graded.reduce((s, c) => s + c.credit, 0);
  if (totalCredit === 0) return 0;
  return graded.reduce((s, c) => s + c.credit * GRADE_POINTS[c.grade], 0) / totalCredit;
}

function semesterSortKey(year: number, semester: CourseSemester): number {
  return year * 10 + (semester === "1학기" ? 1 : 2);
}

function sortCourses(list: Course[]): Course[] {
  return [...list].sort(
    (a, b) => semesterSortKey(a.year, a.semester) - semesterSortKey(b.year, b.semester),
  );
}

function fromRow(row: CourseRow): Course {
  return {
    id: row.id,
    name: row.name,
    credit: Number(row.credit),
    grade: row.grade,
    category: row.category,
    year: row.year,
    semester: row.semester,
  };
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("year", { ascending: true })
      .order("semester", { ascending: true })
      .order("created_at", { ascending: true });
    if (!error && data) {
      setCourses((data as CourseRow[]).map(fromRow));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addCourse = useCallback(async (input: CourseInput) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("courses")
      .insert({
        name: input.name,
        credit: input.credit,
        grade: input.grade,
        category: input.category,
        year: input.year,
        semester: input.semester,
      })
      .select()
      .single();
    if (error) throw error;
    const newCourse = fromRow(data as CourseRow);
    setCourses((prev) => sortCourses([...prev, newCourse]));
    return newCourse;
  }, []);

  const updateCourse = useCallback(async (id: string, input: CourseInput) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("courses")
      .update({
        name: input.name,
        credit: input.credit,
        grade: input.grade,
        category: input.category,
        year: input.year,
        semester: input.semester,
      })
      .eq("id", id);
    if (error) throw error;
    setCourses((prev) =>
      sortCourses(prev.map((c) => (c.id === id ? { ...c, ...input } : c))),
    );
  }, []);

  const deleteCourse = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw error;
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { courses, isLoaded, addCourse, updateCourse, deleteCourse, refresh };
}
