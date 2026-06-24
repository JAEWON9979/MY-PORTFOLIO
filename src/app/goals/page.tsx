"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoalCard from "@/components/goals/GoalCard";
import GoalModal from "@/components/goals/GoalModal";
import CategoryFilter, {
  type CategoryFilterValue,
} from "@/components/goals/CategoryFilter";
import { useGoals, type Goal, type GoalInput } from "@/hooks/useGoals";
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
    isLoaded,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleComplete,
    spawnRecurringInstances,
  } = useGoals();
  const [filter, setFilter] = useState<CategoryFilterValue>("전체");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Spawn today's instances for recurring templates once goals are loaded
  useEffect(() => {
    if (isLoaded) spawnRecurringInstances().catch(() => {});
    // run once after initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    // 일목표는 오늘 마감일 기준만 카운트 (누적 반복 인스턴스가 통계를 왜곡하지 않도록)
    const todayIl = goals.filter((g) => g.category === "일목표" && g.deadline === today);
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
  }, [goals]);

  const filteredGoals = useMemo(() => {
    if (filter === "전체") return goals;
    return goals.filter((g) => g.category === filter);
  }, [goals, filter]);

  const openAddModal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = (input: GoalInput) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, input);
    } else {
      addGoal(input);
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
          {/* Header */}
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

          {/* Stats cards */}
          {isLoaded && (
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

          {/* Category filter */}
          <div className="mb-6">
            <CategoryFilter value={filter} onChange={setFilter} />
          </div>

          {/* Goal list */}
          {isLoaded && filteredGoals.length === 0 ? (
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
