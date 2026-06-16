"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export type CommentInput = Pick<Comment, "postId" | "content" | "authorName">;

interface CommentRow {
  id: string;
  post_id: string;
  content: string;
  author_name: string;
  created_at: string;
}

function fromRow(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    content: row.content,
    authorName: row.author_name,
    createdAt: row.created_at,
  };
}

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setComments((data as CommentRow[]).map(fromRow));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addComment = useCallback(async (input: CommentInput) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: input.postId,
        content: input.content,
        author_name: input.authorName,
      })
      .select()
      .single();
    if (error) throw error;
    const newComment = fromRow(data as CommentRow);
    setComments((prev) => [...prev, newComment]);
    return newComment;
  }, []);

  const deleteComment = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) throw error;
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
