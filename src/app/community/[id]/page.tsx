"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePosts, type PostCategory } from "@/hooks/usePosts";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";

const categoryOptions: PostCategory[] = ["자유", "정보공유", "질문"];

export default function CommunityPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const {
    isLoaded,
    getPostById,
    updatePost,
    deletePost,
    incrementViewCount,
    incrementLikeCount,
    toggleHidden,
  } = usePosts();
  const { getCommentsByPostId, addComment, deleteComment } = useComments();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<PostCategory>("자유");
  const [editError, setEditError] = useState("");

  const [commentContent, setCommentContent] = useState("");
  const [commentError, setCommentError] = useState("");
  const hasCountedView = useRef(false);

  const post = getPostById(params.id);
  const comments = getCommentsByPostId(params.id);
  const isOwner = !!post && !!user && post.userId === user.id;
  const canSeePost = !post?.isHidden || isAdmin;

  useEffect(() => {
    if (post && !hasCountedView.current) {
      hasCountedView.current = true;
      incrementViewCount(post.id);
    }
  }, [post, incrementViewCount]);

  const startEditing = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category);
    setIsEditing(true);
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!post || !editTitle.trim() || !editContent.trim()) return;
    setEditError("");
    try {
      await updatePost(post.id, {
        title: editTitle,
        content: editContent,
        category: editCategory,
        authorName: post.authorName,
      });
      setIsEditing(false);
    } catch {
      setEditError("수정에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return;
    try {
      await deletePost(post.id);
      router.push("/community");
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleAddComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!commentContent.trim() || !post || !user) return;
    setCommentError("");
    const displayName =
      (user.user_metadata?.username as string | undefined) ?? user.email ?? "익명";
    try {
      await addComment({
        postId: post.id,
        content: commentContent,
        authorName: displayName,
      });
      setCommentContent("");
    } catch {
      setCommentError("댓글 등록에 실패했습니다.");
    }
  };

  if (isLoaded && (!post || !canSeePost)) {
    return (
      <div className="flex flex-1 flex-col bg-white">
        <Header />
        <main className="flex-1">
          <section className="mx-auto max-w-3xl px-6 py-12">
            <p className="text-sm text-zinc-500">게시글을 찾을 수 없습니다.</p>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-12">
          {post && (
            <>
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                      카테고리
                    </label>
                    <select
                      value={editCategory}
                      onChange={(event) =>
                        setEditCategory(event.target.value as PostCategory)
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
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
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
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      required
                      maxLength={2000}
                      className="min-h-[200px] w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  {editError && (
                    <p className="text-sm text-red-600">{editError}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      저장
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
                      {post.category}
                    </span>
                    <span>{post.authorName}</span>
                    <span>·</span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <h1 className="mt-1 text-2xl font-bold text-zinc-900">
                    {post.title}
                  </h1>
                  <div className="mt-2 flex gap-3 text-xs text-zinc-500">
                    <span>조회 {post.viewCount}</span>
                    <span>좋아요 {post.likeCount}</span>
                  </div>

                  <p className="mt-6 whitespace-pre-wrap text-zinc-700">
                    {post.content}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => incrementLikeCount(post.id)}
                      className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
                    >
                      좋아요
                    </button>
                    {isOwner && (
                      <>
                        <button
                          type="button"
                          onClick={startEditing}
                          className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await toggleHidden(post.id);
                          } catch {
                            alert("처리 중 오류가 발생했습니다.");
                          }
                        }}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                          post.isHidden
                            ? "bg-zinc-800 text-white hover:bg-zinc-700"
                            : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {post.isHidden ? "숨김 해제" : "숨김 처리"}
                      </button>
                    )}
                  </div>
                </>
              )}

              <div className="mt-10">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                  댓글 {comments.length}
                </h2>
                <ul className="space-y-3">
                  {comments.map((comment) => {
                    const isCommentOwner =
                      !!user && comment.userId === user.id;
                    return (
                      <li
                        key={comment.id}
                        className="rounded-lg border border-zinc-200 p-3"
                      >
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>{comment.authorName}</span>
                          {isCommentOwner && (
                            <button
                              type="button"
                              onClick={() => deleteComment(comment.id)}
                              className="text-zinc-400 hover:text-red-600"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-zinc-700">
                          {comment.content}
                        </p>
                      </li>
                    );
                  })}
                </ul>

                {user ? (
                  <form onSubmit={handleAddComment} className="mt-4 space-y-2">
                    <textarea
                      value={commentContent}
                      onChange={(event) =>
                        setCommentContent(event.target.value)
                      }
                      placeholder="댓글을 입력하세요"
                      required
                      maxLength={500}
                      rows={3}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                    />
                    {commentError && (
                      <p className="text-sm text-red-600">{commentError}</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                      >
                        등록
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-4 rounded-lg border border-zinc-200 p-4 text-center">
                    <p className="text-sm text-zinc-500">
                      댓글 작성은 로그인 후 이용할 수 있습니다.
                    </p>
                    <Link
                      href="/auth/login"
                      className="mt-2 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2"
                    >
                      로그인
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
