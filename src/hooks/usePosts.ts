"use client";

import { useCallback, useEffect, useState } from "react";

export type PostCategory = "자유" | "정보공유" | "질문";

export interface Post {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  viewCount: number;
}

export type PostInput = Pick<
  Post,
  "title" | "content" | "category" | "authorName"
>;

const STORAGE_KEY = "community_posts";

const samplePosts: Post[] = [
  {
    id: "sample-post-1",
    title: "커뮤니티 게시판을 열었습니다",
    content: "자유롭게 의견을 나눠주세요. 잘 부탁드립니다.",
    category: "자유",
    authorName: "운영자",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
    likeCount: 3,
    viewCount: 42,
  },
  {
    id: "sample-post-2",
    title: "행정직 자격증 준비 정보 공유합니다",
    content: "정보처리기사, 컴퓨터활용능력 준비할 때 참고했던 자료들 정리했어요.",
    category: "정보공유",
    authorName: "준비생",
    createdAt: "2026-06-05T10:30:00.000Z",
    updatedAt: "2026-06-05T10:30:00.000Z",
    likeCount: 7,
    viewCount: 120,
  },
  {
    id: "sample-post-3",
    title: "면접 준비 어떻게 하셨나요?",
    content: "행정직 면접 후기나 준비 방법 공유해주실 분 계신가요?",
    category: "질문",
    authorName: "익명",
    createdAt: "2026-06-10T15:15:00.000Z",
    updatedAt: "2026-06-10T15:15:00.000Z",
    likeCount: 1,
    viewCount: 58,
  },
];

function loadPosts(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return samplePosts;
    return JSON.parse(raw) as Post[];
  } catch {
    return samplePosts;
  }
}

function persistPosts(posts: Post[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPosts(loadPosts());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) persistPosts(posts);
  }, [posts, isLoaded]);

  const addPost = useCallback(async (input: PostInput) => {
    const now = new Date().toISOString();
    const newPost: Post = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      likeCount: 0,
      viewCount: 0,
    };
    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  }, []);

  const updatePost = useCallback(async (id: string, input: PostInput) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? { ...post, ...input, updatedAt: new Date().toISOString() }
          : post
      )
    );
  }, []);

  const deletePost = useCallback(async (id: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  }, []);

  const incrementViewCount = useCallback(async (id: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, viewCount: post.viewCount + 1 } : post
      )
    );
  }, []);

  const incrementLikeCount = useCallback(async (id: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, likeCount: post.likeCount + 1 } : post
      )
    );
  }, []);

  const getPostById = useCallback(
    (id: string) => posts.find((post) => post.id === id),
    [posts]
  );

  return {
    posts,
    isLoaded,
    addPost,
    updatePost,
    deletePost,
    incrementViewCount,
    incrementLikeCount,
    getPostById,
  };
}
