"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorkCard from "@/components/works/WorkCard";
import WorkModal from "@/components/works/WorkModal";
import WorkCategoryTabs, {
  type WorkCategoryFilterValue,
} from "@/components/works/WorkCategoryTabs";
import { useWorks } from "@/hooks/useWorks";

export default function WorksPage() {
  const { works, isLoaded, addWork } = useWorks();
  const [filter, setFilter] = useState<WorkCategoryFilterValue>("전체");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredWorks = useMemo(() => {
    if (filter === "전체") return works;
    return works.filter((work) => work.category === filter);
  }, [works, filter]);

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-zinc-900">학습 기록</h1>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              작업물 추가
            </button>
          </div>

          <div className="mb-8">
            <WorkCategoryTabs value={filter} onChange={setFilter} />
          </div>

          {isLoaded && filteredWorks.length === 0 ? (
            <p className="text-sm text-zinc-500">
              아직 등록된 작업물이 없습니다. 작업물을 추가해보세요.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWorks.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />

      {isModalOpen && (
        <WorkModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={(input) => {
            addWork(input);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
