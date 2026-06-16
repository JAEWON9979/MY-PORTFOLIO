"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryTabs, {
  type CategoryFilterValue,
} from "@/components/community/CategoryTabs";
import PostListItem from "@/components/community/PostListItem";
import { usePosts } from "@/hooks/usePosts";
import { useComments } from "@/hooks/useComments";

export default function CommunityPage() {
  const { posts, isLoaded } = usePosts();
  const { getCommentsByPostId } = useComments();
  const [filter, setFilter] = useState<CategoryFilterValue>("전체");

  const filteredPosts = useMemo(() => {
    if (filter === "전체") return posts;
    return posts.filter((post) => post.category === filter);
  }, [posts, filter]);

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-zinc-900">커뮤니티</h1>
            <Link
              href="/community/write"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              글 쓰기
            </Link>
          </div>

          <div className="mb-6">
            <CategoryTabs value={filter} onChange={setFilter} />
          </div>

          {isLoaded && filteredPosts.length === 0 ? (
            <p className="text-sm text-zinc-500">게시글이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <PostListItem
                  key={post.id}
                  post={post}
                  commentCount={getCommentsByPostId(post.id).length}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
