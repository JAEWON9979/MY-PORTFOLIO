"use client";

import Link from "next/link";
import type { Post } from "@/hooks/usePosts";

interface PostListItemProps {
  post: Post;
  commentCount: number;
  isAdmin?: boolean;
}

export default function PostListItem({
  post,
  commentCount,
  isAdmin = false,
}: PostListItemProps) {
  return (
    <Link
      href={`/community/${post.id}`}
      className="flex gap-4 rounded-xl border border-zinc-200 p-4 transition-colors hover:bg-zinc-50"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
        {post.authorName.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
            {post.category}
          </span>
          {isAdmin && post.isHidden && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 font-medium text-white">
              숨김됨
            </span>
          )}
          <span>{post.authorName}</span>
        </div>
        <h2 className="mt-1 truncate text-base font-semibold text-zinc-900">
          {post.title}
        </h2>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
          {post.content}
        </p>
        <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M2 10c1.5-3.5 4.5-5.5 8-5.5s6.5 2 8 5.5c-1.5 3.5-4.5 5.5-8 5.5s-6.5-2-8-5.5Z" />
              <circle cx="10" cy="10" r="2" fill="white" />
            </svg>
            {post.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M2 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-4 4v-4H4a2 2 0 0 1-2-2V4Z" />
            </svg>
            {commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
