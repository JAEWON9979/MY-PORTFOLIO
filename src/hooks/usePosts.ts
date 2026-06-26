"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PostCategory = "자유" | "정보공유" | "질문";

export interface Post {
  id: string;
  userId: string | null;
  title: string;
  content: string;
  category: PostCategory;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  viewCount: number;
  isHidden: boolean;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
}

export type PostInput = Pick<
  Post,
  "title" | "content" | "category" | "authorName"
> & {
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};

interface PostRow {
  id: string;
  user_id: string | null;
  title: string;
  content: string;
  category: PostCategory;
  author_name: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  view_count: number;
  is_hidden: boolean;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
}

function fromRow(row: PostRow): Post {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    category: row.category,
    authorName: row.author_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likeCount: row.like_count,
    viewCount: row.view_count,
    isHidden: row.is_hidden,
    fileUrl: row.file_url,
    fileName: row.file_name,
    fileSize: row.file_size,
  };
}

function extractCommunityFilePath(url: string): string | null {
  const marker = "/object/public/community-files/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setPosts((data as PostRow[]).map(fromRow));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPost = useCallback(async (input: PostInput) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error("로그인이 필요합니다.");
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: input.title,
        content: input.content,
        category: input.category,
        author_name: input.authorName,
        user_id: userId,
        file_url: input.fileUrl ?? null,
        file_name: input.fileName ?? null,
        file_size: input.fileSize ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    const newPost = fromRow(data as PostRow);
    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  }, []);

  const updatePost = useCallback(
    async (id: string, input: PostInput) => {
      const supabase = createClient();
      const updatedAt = new Date().toISOString();
      const updateData: Record<string, unknown> = {
        title: input.title,
        content: input.content,
        category: input.category,
        author_name: input.authorName,
        updated_at: updatedAt,
      };
      if (input.fileUrl !== undefined) updateData.file_url = input.fileUrl;
      if (input.fileName !== undefined) updateData.file_name = input.fileName;
      if (input.fileSize !== undefined) updateData.file_size = input.fileSize;

      const { error } = await supabase
        .from("posts")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== id) return post;
          const updated: Post = {
            ...post,
            title: input.title,
            content: input.content,
            category: input.category,
            authorName: input.authorName,
            updatedAt,
          };
          if (input.fileUrl !== undefined) updated.fileUrl = input.fileUrl ?? null;
          if (input.fileName !== undefined) updated.fileName = input.fileName ?? null;
          if (input.fileSize !== undefined) updated.fileSize = input.fileSize ?? null;
          return updated;
        })
      );
    },
    []
  );

  const deletePost = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const target = posts.find((p) => p.id === id);
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;

      if (target?.fileUrl) {
        const path = extractCommunityFilePath(target.fileUrl);
        if (path) {
          await supabase.storage
            .from("community-files")
            .remove([path])
            .catch(() => {});
        }
      }

      setPosts((prev) => prev.filter((post) => post.id !== id));
    },
    [posts]
  );

  const incrementViewCount = useCallback(
    async (id: string) => {
      const target = posts.find((post) => post.id === id);
      if (!target) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("posts")
        .update({ view_count: target.viewCount + 1 })
        .eq("id", id);
      if (error) return;
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id ? { ...post, viewCount: post.viewCount + 1 } : post
        )
      );
    },
    [posts]
  );

  const incrementLikeCount = useCallback(
    async (id: string) => {
      const target = posts.find((post) => post.id === id);
      if (!target) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("posts")
        .update({ like_count: target.likeCount + 1 })
        .eq("id", id);
      if (error) return;
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id ? { ...post, likeCount: post.likeCount + 1 } : post
        )
      );
    },
    [posts]
  );

  const getPostById = useCallback(
    (id: string) => posts.find((post) => post.id === id),
    [posts]
  );

  const toggleHidden = useCallback(
    async (id: string) => {
      const current = posts.find((p) => p.id === id);
      if (!current) return;
      const next = !current.isHidden;
      const supabase = createClient();
      const { error } = await supabase
        .from("posts")
        .update({ is_hidden: next })
        .eq("id", id);
      if (error) throw error;
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isHidden: next } : p))
      );
    },
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
    toggleHidden,
  };
}
