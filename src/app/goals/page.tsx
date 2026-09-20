"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoalRing from "@/components/home/GoalRing";
import GoalCard from "@/components/goals/GoalCard";
import GoalModal from "@/components/goals/GoalModal";
import RecurringTemplateModal from "@/components/goals/RecurringTemplateModal";
import CategoryFilter, {
  type CategoryFilterValue,
} from "@/components/goals/CategoryFilter";
import {
  useGoals,
  spawnTodayInstances,
  type Goal,
  type GoalInput,
} from "@/hooks/useGoals";
import {
  useRecurringTemplates,
  type RecurringTemplate,
} from "@/hooks/useRecurringTemplates";
import { useAuth } from "@/hooks/useAuth";
import { daysBetween, formatMonthDayWeekday, kstToday } from "@/lib/date";

// 카테고리별 달성 현황 한 줄: 이름 + 개수 + 얇은 진행 막대
function CategoryBar({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium text-zinc-900">{label}</span>
        <span className="tabular-nums text-zinc-500">
          {done}
          <span className="text-zinc-300">/{total}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-zinc-900 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const { user, isLoaded: authLoaded } = useAuth();
  const {
    goals,
    isLoaded: goalsLoaded,
    refresh: refreshGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleComplete,
  } = useGoals();
  const {
    templates,
    isLoaded: templatesLoaded,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useRecurringTemplates();

  const [filter, setFilter] = useState<CategoryFilterValue>("전체");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(false);

  // 세션당 1회 spawn: 양쪽 로드 완료 + 로그인 상태일 때 실행
  const spawnedRef = useRef(false);
  useEffect(() => {
    if (!user || !goalsLoaded || !templatesLoaded || spawnedRef.current) return;
    spawnedRef.current = true;
    spawnTodayInstances(templates, user.id)
      .then((spawned) => { if (spawned.length > 0) refreshGoals(); })
      .catch(() => {});
  }, [user, goalsLoaded, templatesLoaded, templates, refreshGoals]);

  const today = kstToday();

  // 통계: 일목표는 오늘 날짜만 카운트
  const stats = useMemo(() => {
    const todayIl = goals.filter(
      (g) => g.category === "일목표" && g.deadline === today
    );
    const juk = goals.filter((g) => g.category === "주목표");
    const yeon = goals.filter((g) => g.category === "연목표");
    const counted = [...todayIl, ...juk, ...yeon];
    const total = counted.length;
    const done = counted.filter((g) => g.isCompleted).length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    return {
      rate,
      total,
      done,
      일목표: { done: todayIl.filter((g) => g.isCompleted).length, total: todayIl.length },
      주목표: { done: juk.filter((g) => g.isCompleted).length, total: juk.length },
      연목표: { done: yeon.filter((g) => g.isCompleted).length, total: yeon.length },
    };
  }, [goals, today]);

  // 표시 목록: 일목표는 오늘 날짜만, 주·연목표는 전체
  const filteredGoals = useMemo(() => {
    const visible = goals.filter((g) => {
      if (g.category === "일목표") return g.deadline === today;
      return true;
    });
    if (filter === "전체") return visible;
    return visible.filter((g) => g.category === filter);
  }, [goals, filter, today]);

  // 예정된 일목표: 마감일이 오늘 이후인 일목표를 날짜별로 묶는다 (통계에는 포함하지 않음)
  const upcomingGroups = useMemo(() => {
    const upcoming = goals
      .filter((g) => g.category === "일목표" && g.deadline > today)
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
    const groups: { date: string; goals: Goal[] }[] = [];
    for (const goal of upcoming) {
      const last = groups[groups.length - 1];
      if (last && last.date === goal.deadline) last.goals.push(goal);
      else groups.push({ date: goal.deadline, goals: [goal] });
    }
    return groups;
  }, [goals, today]);
  const upcomingCount = upcomingGroups.reduce((n, g) => n + g.goals.length, 0);
  const showUpcomingSection =
    upcomingCount > 0 && (filter === "전체" || filter === "일목표");

  const openAddModal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = async (input: GoalInput, weekdays?: number[]) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, input);
      closeModal();
      return;
    }

    if (input.isRecurring && input.category === "일목표") {
      // recurring_templates에 저장 후, 오늘이 선택된 요일이면 인스턴스 즉시 생성
      const tpl = await addTemplate(input.title, weekdays ?? [0, 1, 2, 3, 4, 5, 6]);
      const spawned = await spawnTodayInstances([tpl], user?.id ?? "");
      if (spawned.length > 0) refreshGoals();
    } else {
      await addGoal(input);
    }
    closeModal();
  };

  const handleTemplateSubmit = async (title: string, weekdays: number[]) => {
    if (!editingTemplate) return;
    try {
      await updateTemplate(editingTemplate.id, title, weekdays);
      setEditingTemplate(null);
    } catch {
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  if (!authLoaded) {
    return (
      <div className="flex flex-1 flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-400">확인 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-zinc-600">
              목표 관리 페이지는 로그인이 필요합니다.
            </p>
            <Link
              href="/auth/login"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              로그인
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-12">
          {/* 헤더 */}
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">목표 관리</h1>
              <p className="mt-1 text-sm text-zinc-500">
                오늘 · {formatMonthDayWeekday(today)}
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
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
              목표 추가
            </button>
          </div>

          {/* 통계: 전체 달성률 링 + 카테고리별 진행 막대 */}
          {goalsLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 rounded-3xl bg-zinc-50 p-6 sm:p-7"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
                <div className="flex items-center gap-5">
                  <GoalRing rate={stats.rate} />
                  <div>
                    <p className="text-xs font-medium text-zinc-500">전체 달성률</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
                      {stats.done}
                      <span className="text-zinc-300">/{stats.total}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">개 달성</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-4">
                  <CategoryBar
                    label="일목표"
                    done={stats.일목표.done}
                    total={stats.일목표.total}
                  />
                  <CategoryBar
                    label="주목표"
                    done={stats.주목표.done}
                    total={stats.주목표.total}
                  />
                  <CategoryBar
                    label="연목표"
                    done={stats.연목표.done}
                    total={stats.연목표.total}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* 반복 중인 일목표 관리 */}
          {templatesLoaded && templates.length > 0 && (
            <div className="mb-8 rounded-3xl bg-zinc-50 px-6 py-5">
              <p className="mb-3 text-xs font-medium text-zinc-500">
                반복 중인 일목표
              </p>
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl) => (
                  <span
                    key={tpl.id}
                    className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm text-zinc-700 ring-1 ring-zinc-200"
                  >
                    {tpl.title}
                    <button
                      type="button"
                      onClick={() => setEditingTemplate(tpl)}
                      aria-label="반복 수정"
                      className="text-zinc-400 hover:text-zinc-700"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.3 2.3a1.5 1.5 0 0 1 2.1 2.1l-7.6 7.6-2.6.6.6-2.6 7.5-7.7z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(tpl.id)}
                      aria-label="반복 삭제"
                      className="text-zinc-400 hover:text-red-500"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" d="M1 1l10 10M11 1L1 11" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-xs text-zinc-400">
                ※ 템플릿 삭제 시 이미 생성된 오늘 목표는 유지됩니다.
              </p>
            </div>
          )}

          {/* 카테고리 필터 */}
          <div className="mb-5">
            <CategoryFilter value={filter} onChange={setFilter} />
          </div>

          {/* 목표 목록 */}
          {goalsLoaded && filteredGoals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 px-6 py-14 text-center">
              <p className="text-sm text-zinc-500">
                {showUpcomingSection
                  ? "오늘 표시할 목표가 없습니다."
                  : "아직 등록된 목표가 없습니다. 목표를 추가해보세요."}
              </p>
              {!showUpcomingSection && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  목표 추가
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredGoals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
                >
                  <GoalCard
                    goal={goal}
                    onToggle={() => toggleComplete(goal.id)}
                    onEdit={() => {
                      setEditingGoal(goal);
                      setIsModalOpen(true);
                    }}
                    onDelete={() => deleteGoal(goal.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* 예정된 일목표 (접이식) */}
          {goalsLoaded && showUpcomingSection && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowUpcoming((v) => !v)}
                aria-expanded={showUpcoming}
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className={`transition-transform ${showUpcoming ? "rotate-90" : ""}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 2l4 4-4 4" />
                </svg>
                예정된 일목표 {upcomingCount}개
              </button>

              {showUpcoming && (
                <div className="mt-3 flex flex-col gap-4">
                  {upcomingGroups.map((group) => {
                    const diff = daysBetween(group.date, today);
                    const dateLabel = formatMonthDayWeekday(group.date);
                    return (
                      <div key={group.date}>
                        <p className="mb-1.5 text-xs font-semibold text-zinc-400">
                          {diff === 1 ? `내일 · ${dateLabel}` : dateLabel}
                        </p>
                        <div className="flex flex-col gap-2.5">
                          {group.goals.map((goal) => (
                            <GoalCard
                              key={goal.id}
                              goal={goal}
                              upcomingLabel={diff === 1 ? "내일" : `D-${diff}`}
                              onToggle={() => toggleComplete(goal.id)}
                              onEdit={() => {
                                setEditingGoal(goal);
                                setIsModalOpen(true);
                              }}
                              onDelete={() => deleteGoal(goal.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />

      {isModalOpen && (
        <GoalModal
          initialGoal={editingGoal}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {editingTemplate && (
        <RecurringTemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSubmit={handleTemplateSubmit}
        />
      )}
    </div>
  );
}
