"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  useCourses,
  calcGPA,
  GRADE_OPTIONS,
  CATEGORY_OPTIONS,
  type Course,
  type CourseInput,
  type CourseGrade,
  type CourseCategory,
  type CourseSemester,
} from "@/hooks/useCourses";

// ── 카테고리 배지 색상 ─────────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<CourseCategory, string> = {
  계공: "bg-violet-50 text-violet-700",
  교필: "bg-amber-50 text-amber-700",
  교선: "bg-sky-50 text-sky-700",
  전공: "bg-indigo-50 text-indigo-700",
};

// ── StatCard ───────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

// ── CourseModal ────────────────────────────────────────────────────────────────

interface CourseModalProps {
  initialCourse: Course | null;
  onClose: () => void;
  onSubmit: (input: CourseInput) => Promise<void>;
}

function CourseModal({ initialCourse, onClose, onSubmit }: CourseModalProps) {
  const [year, setYear] = useState<number>(initialCourse?.year ?? 1);
  const [semester, setSemester] = useState<CourseSemester>(
    initialCourse?.semester ?? "1학기",
  );
  const [name, setName] = useState(initialCourse?.name ?? "");
  const [credit, setCredit] = useState<number>(initialCourse?.credit ?? 3);
  const [grade, setGrade] = useState<CourseGrade>(initialCourse?.grade ?? "A+");
  const [category, setCategory] = useState<CourseCategory>(
    initialCourse?.category ?? "계공",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit({
        year,
        semester,
        name: name.trim(),
        credit,
        grade,
        category,
      });
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-bold text-zinc-900">
          {initialCourse ? "과목 수정" : "과목 추가"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 학년 / 학기 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">학년</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              >
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>{y}학년</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">학기</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as CourseSemester)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              >
                <option value="1학기">1학기</option>
                <option value="2학기">2학기</option>
              </select>
            </div>
          </div>

          {/* 과목명 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">과목명</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              placeholder="예: 행정학원론"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {/* 학점 / 성적 / 이수구분 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">학점</label>
              <input
                type="number"
                value={credit}
                onChange={(e) => setCredit(Math.max(0, Math.min(9, Number(e.target.value))))}
                min={0}
                max={9}
                step={0.5}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">성적</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as CourseGrade)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">이수구분</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CourseCategory)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {initialCourse ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GradesPage() {
  const router = useRouter();
  const { user, isAdmin, isLoaded: authLoaded } = useAuth();
  const { courses, isLoaded, addCourse, updateCourse, deleteCourse, refresh } = useCourses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>("");

  useEffect(() => {
    if (authLoaded && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [authLoaded, user, isAdmin, router]);

  // admin 인증 완료 후 재조회
  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin, refresh]);

  const stats = useMemo(() => {
    const gpa = calcGPA(courses);
    const totalCredits = courses.reduce((s, c) => s + c.credit, 0);
    const gyeGongCredits = courses
      .filter((c) => c.category === "계공" || c.category === "전공")
      .reduce((s, c) => s + c.credit, 0);
    const gyoYangCredits = courses
      .filter((c) => c.category === "교필" || c.category === "교선")
      .reduce((s, c) => s + c.credit, 0);
    return { gpa, totalCredits, gyeGongCredits, gyoYangCredits };
  }, [courses]);

  const semesterGroups = useMemo(() => {
    const keySet = new Set<string>();
    courses.forEach((c) => keySet.add(`${c.year}-${c.semester}`));
    return Array.from(keySet)
      .sort((a, b) => {
        const dashA = a.indexOf("-");
        const dashB = b.indexOf("-");
        const aKey = Number(a.slice(0, dashA)) * 10 + (a.slice(dashA + 1) === "1학기" ? 1 : 2);
        const bKey = Number(b.slice(0, dashB)) * 10 + (b.slice(dashB + 1) === "1학기" ? 1 : 2);
        return aKey - bKey;
      })
      .map((key) => {
        const dashIdx = key.indexOf("-");
        const year = Number(key.slice(0, dashIdx));
        const semester = key.slice(dashIdx + 1) as CourseSemester;
        const semCourses = courses.filter(
          (c) => c.year === year && c.semester === semester,
        );
        return {
          key,
          label: `${year}학년 ${semester}`,
          courses: semCourses,
          gpa: calcGPA(semCourses),
          totalCredits: semCourses.reduce((s, c) => s + c.credit, 0),
        };
      });
  }, [courses]);

  // 첫 로드 시 기본 학기 선택
  useEffect(() => {
    if (semesterGroups.length > 0 && !selectedKey) {
      setSelectedKey(semesterGroups[0].key);
    }
  }, [semesterGroups, selectedKey]);

  const selectedGroup = semesterGroups.find((g) => g.key === selectedKey) ?? null;

  const openAddModal = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = async (input: CourseInput) => {
    if (editingCourse) {
      await updateCourse(editingCourse.id, input);
    } else {
      await addCourse(input);
    }
    closeModal();
  };

  if (!authLoaded || !user || !isAdmin) return null;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-12">
          {/* 페이지 헤더 */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-zinc-900">학점관리</h1>
            <button
              type="button"
              onClick={openAddModal}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              과목 추가
            </button>
          </div>

          {/* 전체 통계 카드 */}
          {isLoaded && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="전체 평점"
                value={courses.length === 0 ? "—" : stats.gpa.toFixed(2)}
                sub="/ 4.5"
              />
              <StatCard
                label="총 학점"
                value={String(stats.totalCredits)}
                sub="학점"
              />
              <StatCard
                label="전공 학점"
                value={String(stats.gyeGongCredits)}
                sub="계공 + 전공"
              />
              <StatCard
                label="교양 학점"
                value={String(stats.gyoYangCredits)}
                sub="교필 + 교선"
              />
            </div>
          )}

          {/* 학기 선택 드롭다운 */}
          {isLoaded && courses.length === 0 ? (
            <p className="text-sm text-zinc-500">
              등록된 과목이 없습니다. 과목을 추가해보세요.
            </p>
          ) : isLoaded && (
            <>
              <div className="mb-5 flex items-center gap-3">
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 focus:border-zinc-500 focus:outline-none"
                >
                  {semesterGroups.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.label}
                    </option>
                  ))}
                </select>
                {selectedGroup && (
                  <>
                    <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white">
                      {selectedGroup.gpa.toFixed(2)}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {selectedGroup.totalCredits}학점
                    </span>
                  </>
                )}
              </div>

              {/* 선택된 학기 과목 목록 */}
              {selectedGroup && (
                <div className="flex flex-col gap-2">
                  {selectedGroup.courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-shadow hover:shadow-sm"
                    >
                      <p className="flex-1 truncate text-sm font-medium text-zinc-900">
                        {course.name}
                      </p>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[course.category]}`}
                        >
                          {course.category}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {course.credit}학점
                        </span>
                        <span
                          className={`w-7 text-center text-sm font-bold ${
                            course.grade === "P" ? "text-emerald-600" : "text-zinc-900"
                          }`}
                        >
                          {course.grade}
                        </span>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(course)}
                          className="rounded px-1.5 py-1 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCourse(course.id)}
                          className="rounded px-1.5 py-1 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />

      {isModalOpen && (
        <CourseModal
          initialCourse={editingCourse}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
