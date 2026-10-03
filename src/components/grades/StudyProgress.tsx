"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import RowActions from "@/components/ui/RowActions";
import { useBackdropClose } from "@/hooks/useBackdropClose";
import { daysBetween, formatDday, formatMonthDayWeekday, kstToday } from "@/lib/date";
import {
  useStudyProgress,
  currentWeekOf,
  weekStartDate,
  progressKey,
  type StudyCourse,
  type StudyStatus,
  type StudyTerm,
  type StudyTermInput,
} from "@/hooks/useStudyProgress";

const INPUT_CLASS =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none";

const STATUS_LABELS: Record<StudyStatus, string> = {
  0: "안 함",
  1: "수업만 들음",
  2: "복습 완료",
};

// 학습률 계산: 복습 완료 = 1, 수업만 들음 = 0.5
const STATUS_SCORE: Record<StudyStatus, number> = { 0: 0, 1: 0.5, 2: 1 };

// 밀린 주차가 이만큼 이상이면 과목을 강조
const BEHIND_WARN = 2;

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

function defaultTermLabel(): string {
  const [y, m] = kstToday().split("-").map(Number);
  return `${y}-${m >= 7 ? 2 : 1}학기`;
}

// ── TermModal ──────────────────────────────────────────────────────────────────

interface TermModalProps {
  initialTerm: StudyTerm | null;
  onClose: () => void;
  onSubmit: (input: StudyTermInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function TermModal({ initialTerm, onClose, onSubmit, onDelete }: TermModalProps) {
  const [label, setLabel] = useState(initialTerm?.label ?? defaultTermLabel());
  const [startDate, setStartDate] = useState(initialTerm?.startDate ?? "");
  const [midtermWeek, setMidtermWeek] = useState(initialTerm?.midtermWeek ?? 8);
  const [finalWeek, setFinalWeek] = useState(initialTerm?.finalWeek ?? 15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const backdropProps = useBackdropClose(onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !startDate) return;
    if (finalWeek <= midtermWeek + 1) {
      setError("기말고사는 중간고사보다 2주 이상 뒤여야 합니다.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit({ label: label.trim(), startDate, midtermWeek, finalWeek });
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm("이 학기와 과목·진도 기록을 모두 삭제할까요?")) return;
    setIsSubmitting(true);
    try {
      await onDelete();
    } catch {
      setError("삭제에 실패했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      {...backdropProps}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl">
        <h2 className="mb-5 text-lg font-bold text-zinc-900">
          {initialTerm ? "학기 설정" : "새 학기"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">학기 이름</label>
              <input
                type="text"
                spellCheck={false}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
                maxLength={30}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">개강일 (1주차)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">중간고사 주차</label>
              <input
                type="number"
                value={midtermWeek}
                onChange={(e) => setMidtermWeek(Math.max(2, Math.min(20, Number(e.target.value))))}
                min={2}
                max={20}
                required
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">기말고사 주차</label>
              <input
                type="number"
                value={finalWeek}
                onChange={(e) => setFinalWeek(Math.max(3, Math.min(24, Number(e.target.value))))}
                min={3}
                max={24}
                required
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between gap-2 pt-1">
            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="rounded-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                학기 삭제
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {initialTerm ? "저장" : "추가"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── CourseNameModal ────────────────────────────────────────────────────────────

interface CourseNameModalProps {
  initialName: string | null;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

function CourseNameModal({ initialName, onClose, onSubmit }: CourseNameModalProps) {
  const [name, setName] = useState(initialName ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const backdropProps = useBackdropClose(onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      {...backdropProps}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl">
        <h2 className="mb-5 text-lg font-bold text-zinc-900">
          {initialName === null ? "수강 과목 추가" : "과목 이름 수정"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            spellCheck={false}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
            placeholder="예: 행정학원론"
            className={INPUT_CLASS}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {initialName === null ? "추가" : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── WeekCell ───────────────────────────────────────────────────────────────────

function WeekCell({
  week,
  status,
  isCurrent,
  onClick,
}: {
  week: number;
  status: StudyStatus;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const tone =
    status === 2
      ? "bg-zinc-900 text-white"
      : status === 1
        ? "bg-zinc-300 text-zinc-800"
        : "bg-white text-zinc-400 ring-1 ring-inset ring-zinc-200 hover:ring-zinc-400";
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${week}주차 · ${STATUS_LABELS[status]}`}
      aria-label={`${week}주차 ${STATUS_LABELS[status]}, 눌러서 변경`}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors ${tone} ${
        isCurrent ? "outline outline-2 outline-offset-2 outline-zinc-900" : ""
      }`}
    >
      {week}
    </button>
  );
}

// ── Section ────────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  examLabel: string;
  weeks: number[];
  currentWeek: number;
  courses: StudyCourse[];
  progress: Record<string, StudyStatus>;
  isOpen: boolean;
  onToggle: () => void;
  onCycle: (courseId: string, week: number) => void;
  onEditCourse: (course: StudyCourse) => void;
  onDeleteCourse: (course: StudyCourse) => void;
}

function Section({
  title,
  examLabel,
  weeks,
  currentWeek,
  courses,
  progress,
  isOpen,
  onToggle,
  onCycle,
  onEditCourse,
  onDeleteCourse,
}: SectionProps) {
  const statusOf = (courseId: string, week: number): StudyStatus =>
    progress[progressKey(courseId, week)] ?? 0;

  const rateOf = (courseId: string) =>
    weeks.length === 0
      ? 0
      : weeks.reduce((s, w) => s + STATUS_SCORE[statusOf(courseId, w)], 0) / weeks.length;

  // 이미 지나간 주차 중 복습을 끝내지 못한 주 수
  const behindOf = (courseId: string) =>
    weeks.filter((w) => w < currentWeek && statusOf(courseId, w) < 2).length;

  const sectionRate =
    courses.length === 0 ? 0 : courses.reduce((s, c) => s + rateOf(c.id), 0) / courses.length;

  return (
    <div className="rounded-3xl border border-zinc-200">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="text-[15px] font-semibold text-zinc-900">{title}</span>
        <span className="text-xs text-zinc-400">
          {weeks[0]}~{weeks[weeks.length - 1]}주차
        </span>
        <span className="ml-auto text-sm font-semibold tabular-nums text-zinc-900">
          {Math.round(sectionRate * 100)}%
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
          className={`text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="flex flex-col gap-2.5 px-2 pb-2 sm:px-4 sm:pb-4">
          {courses.map((course) => {
            const rate = rateOf(course.id);
            const behind = behindOf(course.id);
            return (
              <div
                key={course.id}
                className={`group rounded-2xl px-3 py-3.5 sm:px-4 ${
                  behind >= BEHIND_WARN ? "bg-red-50/70" : "bg-zinc-50"
                }`}
              >
                <div className="mb-2.5 flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-zinc-900">
                    {course.name}
                  </p>
                  {behind >= BEHIND_WARN ? (
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                      {behind}주 밀림
                    </span>
                  ) : behind === 0 && weeks.some((w) => w < currentWeek) ? (
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200">
                      진도 맞춤
                    </span>
                  ) : null}
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-700">
                    {Math.round(rate * 100)}%
                  </span>
                  <RowActions
                    onEdit={() => onEditCourse(course)}
                    onDelete={() => onDeleteCourse(course)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                  {weeks.map((w) => (
                    <WeekCell
                      key={w}
                      week={w}
                      status={statusOf(course.id, w)}
                      isCurrent={w === currentWeek}
                      onClick={() => onCycle(course.id, w)}
                    />
                  ))}
                  <span className="ml-0.5 flex h-8 items-center rounded-lg border border-dashed border-zinc-300 px-1.5 sm:ml-1 sm:px-2 text-[11px] font-medium text-zinc-500">
                    {examLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── TermView ───────────────────────────────────────────────────────────────────

interface TermViewProps {
  term: StudyTerm;
  courses: StudyCourse[];
  progress: Record<string, StudyStatus>;
  onCycle: (courseId: string, week: number) => void;
  onAddCourse: () => void;
  onEditCourse: (course: StudyCourse) => void;
  onDeleteCourse: (course: StudyCourse) => void;
}

function TermView({
  term,
  courses,
  progress,
  onCycle,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
}: TermViewProps) {
  const currentWeek = currentWeekOf(term);
  const beforeMidterm = currentWeek <= term.midtermWeek;
  const [openSections, setOpenSections] = useState({
    midterm: beforeMidterm,
    final: !beforeMidterm,
  });

  const midtermWeeks = range(1, term.midtermWeek - 1);
  const finalWeeks = range(term.midtermWeek + 1, term.finalWeek - 1);

  const today = kstToday();
  const nextExam = useMemo(() => {
    const exams = [
      { label: "중간고사", date: weekStartDate(term, term.midtermWeek), endWeek: term.midtermWeek },
      { label: "기말고사", date: weekStartDate(term, term.finalWeek), endWeek: term.finalWeek },
    ];
    return exams.find((e) => currentWeek <= e.endWeek) ?? null;
  }, [term, currentWeek]);

  const weekLabel =
    currentWeek === 0
      ? "개강 전"
      : currentWeek > term.finalWeek
        ? "종강"
        : currentWeek === term.midtermWeek
          ? `${currentWeek}주차 · 중간고사 기간`
          : currentWeek === term.finalWeek
            ? `${currentWeek}주차 · 기말고사 기간`
            : `${currentWeek}주차`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 rounded-3xl bg-zinc-50 p-6 sm:p-7"
      >
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-500">현재</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900">{weekLabel}</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              개강 {formatMonthDayWeekday(term.startDate)}
            </p>
          </div>
          {nextExam && (
            <div>
              <p className="text-xs font-medium text-zinc-500">{nextExam.label}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900">
                {daysBetween(nextExam.date, today) > 0
                  ? formatDday(daysBetween(nextExam.date, today))
                  : "시험 주간"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {formatMonthDayWeekday(nextExam.date)} 주
              </p>
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
          {([0, 1, 2] as StudyStatus[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span
                className={`h-3 w-3 rounded ${
                  s === 2 ? "bg-zinc-900" : s === 1 ? "bg-zinc-300" : "bg-white ring-1 ring-inset ring-zinc-300"
                }`}
              />
              {STATUS_LABELS[s]}
            </span>
          ))}
          <span className="text-zinc-400">· 칸을 누를 때마다 상태가 바뀝니다</span>
        </div>
      </motion.div>

      {courses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 px-6 py-14 text-center">
          <p className="text-sm text-zinc-500">이번 학기 수강 과목을 추가해보세요.</p>
          <button
            type="button"
            onClick={onAddCourse}
            className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            수강 과목 추가
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[
            { key: "midterm" as const, title: "중간고사 전", examLabel: "중간", weeks: midtermWeeks },
            { key: "final" as const, title: "기말고사 전", examLabel: "기말", weeks: finalWeeks },
          ].map((s) => (
            <Section
              key={s.key}
              title={s.title}
              examLabel={s.examLabel}
              weeks={s.weeks}
              currentWeek={currentWeek}
              courses={courses}
              progress={progress}
              isOpen={openSections[s.key]}
              onToggle={() => setOpenSections((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
              onCycle={onCycle}
              onEditCourse={onEditCourse}
              onDeleteCourse={onDeleteCourse}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ── StudyProgress ──────────────────────────────────────────────────────────────

export default function StudyProgress() {
  const {
    terms,
    courses,
    progress,
    isLoaded,
    addTerm,
    updateTerm,
    deleteTerm,
    addCourse,
    renameCourse,
    deleteCourse,
    setStatus,
  } = useStudyProgress();
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  // null = 닫힘, "new" = 새 학기, "edit" = 선택한 학기 설정
  const [termModal, setTermModal] = useState<"new" | "edit" | null>(null);
  // undefined = 닫힘, null = 새 과목, StudyCourse = 이름 수정
  const [courseModal, setCourseModal] = useState<StudyCourse | null | undefined>(undefined);

  const term = terms.find((t) => t.id === selectedTermId) ?? terms[0] ?? null;
  const termCourses = useMemo(
    () => (term ? courses.filter((c) => c.termId === term.id) : []),
    [courses, term],
  );

  const handleCycle = (courseId: string, week: number) => {
    const prev = progress[progressKey(courseId, week)] ?? 0;
    const next = ((prev + 1) % 3) as StudyStatus;
    setStatus(courseId, week, next, prev).catch(() => {
      window.alert("저장에 실패했습니다. 다시 시도해주세요.");
    });
  };

  const handleDeleteCourse = (course: StudyCourse) => {
    if (!window.confirm(`'${course.name}' 과목과 진도 기록을 삭제할까요?`)) return;
    deleteCourse(course.id).catch(() => {
      window.alert("삭제에 실패했습니다. 다시 시도해주세요.");
    });
  };

  if (!isLoaded) return null;

  return (
    <>
      {term === null ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 px-6 py-14 text-center">
          <p className="text-sm text-zinc-500">
            개강일과 시험 주차를 먼저 설정하면 현재 주차가 자동으로 계산됩니다.
          </p>
          <button
            type="button"
            onClick={() => setTermModal("new")}
            className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            학기 설정
          </button>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {terms.length > 1 ? (
              <select
                value={term.id}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="rounded-full border border-transparent bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors focus:border-zinc-300 focus:bg-white focus:outline-none"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900">
                {term.label}
              </span>
            )}
            <button
              type="button"
              onClick={() => setTermModal("edit")}
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              학기 설정
            </button>
            <button
              type="button"
              onClick={() => setTermModal("new")}
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              새 학기
            </button>
            <button
              type="button"
              onClick={() => setCourseModal(null)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path strokeLinecap="round" d="M6 1.5v9M1.5 6h9" />
              </svg>
              수강 과목
            </button>
          </div>

          {/* 학기 설정이 바뀌면 섹션 펼침 기본값을 다시 계산하도록 key에 포함 */}
          <TermView
            key={`${term.id}-${term.startDate}-${term.midtermWeek}-${term.finalWeek}`}
            term={term}
            courses={termCourses}
            progress={progress}
            onCycle={handleCycle}
            onAddCourse={() => setCourseModal(null)}
            onEditCourse={(course) => setCourseModal(course)}
            onDeleteCourse={handleDeleteCourse}
          />
        </>
      )}

      {termModal && (
        <TermModal
          initialTerm={termModal === "edit" ? term : null}
          onClose={() => setTermModal(null)}
          onSubmit={async (input) => {
            if (termModal === "edit" && term) {
              await updateTerm(term.id, input);
            } else {
              const created = await addTerm(input);
              setSelectedTermId(created.id);
            }
            setTermModal(null);
          }}
          onDelete={
            termModal === "edit" && term
              ? async () => {
                  await deleteTerm(term.id);
                  setSelectedTermId("");
                  setTermModal(null);
                }
              : undefined
          }
        />
      )}

      {courseModal !== undefined && term && (
        <CourseNameModal
          initialName={courseModal?.name ?? null}
          onClose={() => setCourseModal(undefined)}
          onSubmit={async (name) => {
            if (courseModal) {
              await renameCourse(courseModal.id, name);
            } else {
              await addCourse(term.id, name);
            }
            setCourseModal(undefined);
          }}
        />
      )}
    </>
  );
}
