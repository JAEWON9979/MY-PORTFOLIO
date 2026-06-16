"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePosts, type PostCategory } from "@/hooks/usePosts";

const categoryOptions: PostCategory[] = ["자유", "정보공유", "질문"];

export default function CommunityWritePage() {
  const router = useRouter();
  const { addPost } = usePosts();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("자유");
  const [authorName, setAuthorName] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim() || !authorName.trim()) return;
    const newPost = await addPost({ title, content, category, authorName });
    router.push(`/community/${newPost.id}`);
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
                className="min-h-[200px] w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                작성자 이름
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder="로그인 없이 직접 입력해주세요"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
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
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
