"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoalCard from "@/components/goals/GoalCard";
import GoalModal from "@/components/goals/GoalModal";
import CategoryFilter, {
  type CategoryFilterValue,
} from "@/components/goals/CategoryFilter";
import {
  useGoals,
  spawnTodayInstances,
  type Goal,
  type GoalInput,
} from "@/hooks/useGoals";
import { useRecurringTemplates } from "@/hooks/useRecurringTemplates";
import { useAuth } from "@/hooks/useAuth";

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
    deleteTemplate,
  } = useRecurringTemplates();

  const [filter, setFilter] = useState<CategoryFilterValue>("전체");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // 세션당 1회 spawn: 양쪽 로드 완료 + 로그인 상태일 때 실행
  const spawnedRef = useRef(false);
  useEffect(() => {
    if (!user || !goalsLoaded || !templatesLoaded || spawnedRef.current) return;
    spawnedRef.current = true;
    spawnTodayInstances(templates, user.id)
      .then((spawned) => { if (spawned.length > 0) refreshGoals(); })
      .catch(() => {});
  }, [user, goalsLoaded, templatesLoaded, templates, refreshGoals]);

  const today = new Date().toISOString().slice(0, 10);

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

  const openAddModal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = async (input: GoalInput) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, input);
      closeModal();
      return;
    }

    if (input.isRecurring && input.category === "일목표") {
      // recurring_templates에 저장 후 오늘 인스턴스 즉시 생성
      const tpl = await addTemplate(input.title);
      const spawned = await spawnTodayInstances([tpl], user?.id ?? "");
      if (spawned.length > 0) refreshGoals();
    } else {
      await addGoal(input);
    }
    closeModal();
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
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-zinc-900">목표 관리</h1>
            <button
              type="button"
              onClick={openAddModal}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              목표 추가
            </button>
          </div>

          {/* 반복 중인 일목표 관리 */}
          {templatesLoaded && templates.length > 0 && (
            <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-sky-600">
                반복 중인 일목표
              </p>
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl) => (
                  <span
                    key={tpl.id}
                    className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3 py-1 text-sm text-zinc-700"
                  >
                    {tpl.title}
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

          {/* 통계 카드 */}
          {goalsLoaded && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="전체 달성률"
                value={`${stats.rate}%`}
                sub={`${stats.done}/${stats.total}개 달성`}
              />
              <StatCard
                label="일목표"
                value={`${stats.일목표.done}/${stats.일목표.total}`}
                sub="개 달성"
              />
              <StatCard
                label="주목표"
                value={`${stats.주목표.done}/${stats.주목표.total}`}
                sub="개 달성"
              />
              <StatCard
                label="연목표"
                value={`${stats.연목표.done}/${stats.연목표.total}`}
                sub="개 달성"
              />
            </div>
          )}

          {/* 카테고리 필터 */}
          <div className="mb-6">
            <CategoryFilter value={filter} onChange={setFilter} />
          </div>

          {/* 목표 목록 */}
          {goalsLoaded && filteredGoals.length === 0 ? (
            <p className="text-sm text-zinc-500">
              아직 등록된 목표가 없습니다. 목표를 추가해보세요.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onToggle={() => toggleComplete(goal.id)}
                  onEdit={() => {
                    setEditingGoal(goal);
                    setIsModalOpen(true);
                  }}
                  onDelete={() => deleteGoal(goal.id)}
                />
              ))}
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
    </div>
  );
}
