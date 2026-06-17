"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePosts, type PostCategory } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";

const categoryOptions: PostCategory[] = ["자유", "정보공유", "질문"];

export default function CommunityWritePage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const { addPost } = usePosts();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("자유");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/auth/login");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) return null;

  const displayName =
    (user.user_metadata?.username as string | undefined) ?? user.email ?? "익명";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setError("");
    try {
      const newPost = await addPost({
        title,
        content,
        category,
        authorName: displayName,
      });
      router.push(`/community/${newPost.id}`);
    } catch {
      setError("게시글 등록에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="mb-6 text-2xl font-bold text-zinc-900">글쓰기</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                카테고리
              </label>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as PostCategory)
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={100}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                내용
              </label>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
                maxLength={2000}
                className="min-h-[200px] w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                작성자: <span className="font-medium text-zinc-700">{displayName}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/community")}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  등록
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
