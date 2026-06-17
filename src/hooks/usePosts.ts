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
}

export type PostInput = Pick<
  Post,
  "title" | "content" | "category" | "authorName"
>;

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
  };
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
      const { error } = await supabase
        .from("posts")
        .update({
          title: input.title,
          content: input.content,
          category: input.category,
          author_name: input.authorName,
          updated_at: updatedAt,
        })
        .eq("id", id);
      if (error) throw error;
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id ? { ...post, ...input, updatedAt } : post
        )
      );
    },
    []
  );

  const deletePost = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;
    setPosts((prev) => prev.filter((post) => post.id !== id));
  }, []);

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
