"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoalCard from "@/components/goals/GoalCard";
import GoalModal from "@/components/goals/GoalModal";
import CategoryFilter, {
  type CategoryFilterValue,
} from "@/components/goals/CategoryFilter";
import { useGoals, type Goal, type GoalInput } from "@/hooks/useGoals";

export default function GoalsPage() {
  const { goals, isLoaded, addGoal, updateGoal, deleteGoal, updateProgress } =
    useGoals();
  const [filter, setFilter] = useState<CategoryFilterValue>("전체");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const filteredGoals = useMemo(() => {
    if (filter === "전체") return goals;
    return goals.filter((goal) => goal.category === filter);
  }, [goals, filter]);

  const openAddModal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
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

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-12">
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

          <div className="mb-8">
            <CategoryFilter value={filter} onChange={setFilter} />
          </div>

          {isLoaded && filteredGoals.length === 0 ? (
            <p className="text-sm text-zinc-500">
              아직 등록된 목표가 없습니다. 목표를 추가해보세요.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => openEditModal(goal)}
                  onDelete={() => deleteGoal(goal.id)}
                  onProgressChange={(progress) =>
                    updateProgress(goal.id, progress)
                  }
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
