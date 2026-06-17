"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryTabs, {
  type CategoryFilterValue,
} from "@/components/community/CategoryTabs";
import PostListItem from "@/components/community/PostListItem";
import SearchBar from "@/components/ui/SearchBar";
import { usePosts } from "@/hooks/usePosts";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";

type CommunitySort =
  | "최신순"
  | "오래된순"
  | "좋아요 많은순"
  | "댓글 많은순"
  | "조회수 많은순";

const SORT_OPTIONS: CommunitySort[] = [
  "최신순",
  "오래된순",
  "좋아요 많은순",
  "댓글 많은순",
  "조회수 많은순",
];

export default function CommunityPage() {
  const { user } = useAuth();
  const { posts, isLoaded } = usePosts();
  const { comments } = useComments();
  const [filter, setFilter] = useState<CategoryFilterValue>("전체");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<CommunitySort>("최신순");

  const displayPosts = useMemo(() => {
    // 1. category filter
    let result = filter === "전체" ? posts : posts.filter((p) => p.category === filter);

    // 2. title search
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((p) => p.title.toLowerCase().includes(q));

    // 3. sort
    const commentCountMap = new Map<string, number>();
    if (sort === "댓글 많은순") {
      for (const c of comments) {
        commentCountMap.set(c.postId, (commentCountMap.get(c.postId) ?? 0) + 1);
      }
    }

    return [...result].sort((a, b) => {
      switch (sort) {
        case "최신순":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "오래된순":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "좋아요 많은순":
          return b.likeCount - a.likeCount;
        case "댓글 많은순":
          return (commentCountMap.get(b.id) ?? 0) - (commentCountMap.get(a.id) ?? 0);
        case "조회수 많은순":
          return b.viewCount - a.viewCount;
        default:
          return 0;
      }
    });
  }, [posts, comments, filter, search, sort]);

  const isEmpty = isLoaded && displayPosts.length === 0;
  const isSearchEmpty = isEmpty && (search.trim() !== "" || filter !== "전체");

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-12">
          {/* Page header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-zinc-900">커뮤니티</h1>
            {user && (
              <Link
                href="/community/write"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                글 쓰기
              </Link>
            )}
          </div>

          {/* Search + sort */}
          <div className="mb-4 flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="제목 검색..." />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as CommunitySort)}
              className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Category tabs */}
          <div className="mb-6">
            <CategoryTabs value={filter} onChange={setFilter} />
          </div>

          {/* List */}
          {isEmpty ? (
            <p className="text-sm text-zinc-500">
              {isSearchEmpty ? "검색 결과가 없습니다." : "게시글이 없습니다."}
            </p>
          ) : (
            <div className="space-y-3">
              {displayPosts.map((post) => {
                const count = comments.filter((c) => c.postId === post.id).length;
                return (
                  <PostListItem key={post.id} post={post} commentCount={count} />
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
