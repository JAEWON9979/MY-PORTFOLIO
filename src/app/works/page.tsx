"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorkCard from "@/components/works/WorkCard";
import WorkModal from "@/components/works/WorkModal";
import WorkCategoryTabs, {
  type WorkCategoryFilterValue,
} from "@/components/works/WorkCategoryTabs";
import SearchBar from "@/components/ui/SearchBar";
import { useWorks } from "@/hooks/useWorks";
import { useAuth } from "@/hooks/useAuth";

type WorksSort = "최신순" | "오래된순" | "제목 가나다순";

const SORT_OPTIONS: WorksSort[] = ["최신순", "오래된순", "제목 가나다순"];

export default function WorksPage() {
  const { isAdmin } = useAuth();
  const { works, isLoaded, addWork } = useWorks();
  const [filter, setFilter] = useState<WorkCategoryFilterValue>("전체");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<WorksSort>("최신순");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addError, setAddError] = useState("");

  const displayWorks = useMemo(() => {
    // 1. category filter
    let result =
      filter === "전체" ? works : works.filter((w) => w.category === filter);

    // 2. title search
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((w) => w.title.toLowerCase().includes(q));

    // 3. sort
    return [...result].sort((a, b) => {
      switch (sort) {
        case "최신순":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "오래된순":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "제목 가나다순":
          return a.title.localeCompare(b.title, "ko");
        default:
          return 0;
      }
    });
  }, [works, filter, search, sort]);

  const isEmpty = isLoaded && displayWorks.length === 0;
  const isSearchEmpty = isEmpty && (search.trim() !== "" || filter !== "전체");

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-12">
          {/* Page header */}
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">학습 기록</h1>
              {isLoaded && (
                <p className="mt-1 text-sm text-zinc-500">
                  {works.length === 0
                    ? "등록된 기록이 없습니다"
                    : `총 ${works.length}개의 기록`}
                </p>
              )}
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
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
                작업물 추가
              </button>
            )}
          </div>

          {/* Search + sort */}
          <div className="mb-5 flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="제목 검색..." />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as WorksSort)}
              className="shrink-0 rounded-full border border-transparent bg-zinc-100 px-4 py-2.5 text-sm text-zinc-700 transition-colors focus:border-zinc-300 focus:bg-white focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Category tabs */}
          <div className="mb-8">
            <WorkCategoryTabs value={filter} onChange={setFilter} />
          </div>

          {/* Grid */}
          {isEmpty ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 px-6 py-14 text-center">
              <p className="text-sm text-zinc-500">
                {isSearchEmpty ? "검색 결과가 없습니다." : "아직 등록된 작업물이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayWorks.map((work, index) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05 }}
                >
                  <WorkCard work={work} isAdmin={isAdmin} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />

      {isModalOpen && (
        <WorkModal
          onClose={() => { setIsModalOpen(false); setAddError(""); }}
          onSubmit={async (input) => {
            setAddError("");
            try {
              await addWork(input);
              setIsModalOpen(false);
            } catch {
              setAddError("저장에 실패했습니다. 다시 시도해주세요.");
            }
          }}
          submitError={addError}
        />
      )}
    </div>
  );
}
