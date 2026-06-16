"use client";

import { useCallback, useEffect, useState } from "react";

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export type CommentInput = Pick<Comment, "postId" | "content" | "authorName">;

const STORAGE_KEY = "community_comments";

const sampleComments: Comment[] = [
  {
    id: "sample-comment-1",
    postId: "sample-post-1",
    content: "환영합니다! 자주 들르겠습니다.",
    authorName: "방문자1",
    createdAt: "2026-06-01T11:00:00.000Z",
  },
  {
    id: "sample-comment-2",
    postId: "sample-post-2",
    content: "좋은 정보 감사합니다.",
    authorName: "준비생2",
    createdAt: "2026-06-05T12:00:00.000Z",
  },
  {
    id: "sample-comment-3",
    postId: "sample-post-3",
    content: "저도 궁금했던 내용이에요.",
    authorName: "익명2",
    createdAt: "2026-06-10T16:00:00.000Z",
  },
];

function loadComments(): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleComments;
    return JSON.parse(raw) as Comment[];
  } catch {
    return sampleComments;
  }
}

function persistComments(comments: Comment[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setComments(loadComments());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) persistComments(comments);
  }, [comments, isLoaded]);

  const addComment = useCallback(async (input: CommentInput) => {
    const newComment: Comment = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);
    return newComment;
  }, []);

  const deleteComment = useCallback(async (id: string) => {
    setComments((prev) => prev.filter((comment) => comment.id !== id));
  }, []);

  const getCommentsByPostId = useCallback(
    (postId: string) =>
      comments.filter((comment) => comment.postId === postId),
    [comments]
  );

  return {
    comments,
    isLoaded,
    addComment,
    deleteComment,
    getCommentsByPostId,
  };
}
