"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePosts, type PostCategory } from "@/hooks/usePosts";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

const categoryOptions: PostCategory[] = ["자유", "정보공유", "질문"];

const ALLOWED_EXTS = [".pdf", ".pptx", ".docx", ".jpg", ".jpeg", ".png"];

type PostFileType = "PDF" | "PPTX" | "DOCX" | "이미지" | "기타";

const FILE_TYPE_ICONS: Record<PostFileType, string> = {
  PDF: "📄",
  PPTX: "📊",
  DOCX: "📝",
  이미지: "🖼️",
  기타: "📁",
};

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: PostFileType;
}

function getFileType(filename: string): PostFileType {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  if (ext === ".pdf") return "PDF";
  if (ext === ".pptx") return "PPTX";
  if (ext === ".docx") return "DOCX";
  if ([".jpg", ".jpeg", ".png"].includes(ext)) return "이미지";
  return "기타";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractCommunityFilePath(url: string): string | null {
  const marker = "/object/public/community-files/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

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

  const [editFile, setEditFile] = useState<UploadedFile | null>(null);
  const [editOriginalFileUrl, setEditOriginalFileUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setEditOriginalFileUrl(post.fileUrl);
    setEditFile(
      post.fileUrl && post.fileName
        ? {
            url: post.fileUrl,
            name: post.fileName,
            size: post.fileSize ?? 0,
            type: getFileType(post.fileName),
          }
        : null
    );
    setFileError("");
    setIsEditing(true);
  };

  const handleFile = async (file: File) => {
    setFileError("");
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!ALLOWED_EXTS.includes(ext)) {
      setFileError("PDF, PPTX, DOCX, JPG, PNG 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("10MB 이하의 파일만 업로드 가능합니다.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("로그인이 필요합니다.");

      const rand = Math.random().toString(36).slice(2, 7);
      const storagePath = `${session.user.id}/${Date.now()}-${rand}${ext}`;
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const err = JSON.parse(xhr.responseText) as {
                error?: string;
                message?: string;
              };
              reject(new Error(err.error ?? err.message ?? `오류 ${xhr.status}`));
            } catch {
              reject(new Error(`업로드 오류 (${xhr.status})`));
            }
          }
        };
        xhr.onerror = () => reject(new Error("네트워크 오류"));
        xhr.open(
          "POST",
          `${projectUrl}/storage/v1/object/community-files/${storagePath}`
        );
        xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
        xhr.setRequestHeader("apikey", anonKey);
        xhr.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream"
        );
        xhr.send(file);
      });

      const { data: urlData } = supabase.storage
        .from("community-files")
        .getPublicUrl(storagePath);

      setEditFile({
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: getFileType(file.name),
      });
    } catch (err) {
      setFileError(
        err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!post || !editTitle.trim() || !editContent.trim()) return;
    setEditError("");
    try {
      // If file was replaced or removed, delete old file from storage
      if (editOriginalFileUrl && editFile?.url !== editOriginalFileUrl) {
        const supabase = createClient();
        const path = extractCommunityFilePath(editOriginalFileUrl);
        if (path) {
          await supabase.storage
            .from("community-files")
            .remove([path])
            .catch(() => {});
        }
      }

      await updatePost(post.id, {
        title: editTitle,
        content: editContent,
        category: editCategory,
        authorName: post.authorName,
        fileUrl: editFile?.url ?? null,
        fileName: editFile?.name ?? null,
        fileSize: editFile?.size ?? null,
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

                  {/* File attachment (edit) */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                      파일 첨부 (선택)
                    </label>

                    {!editFile && !isUploading && (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 transition-colors ${
                          isDragging
                            ? "border-zinc-500 bg-zinc-50"
                            : "border-zinc-300 hover:border-zinc-400"
                        }`}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-zinc-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-zinc-500">
                          파일을 드래그하거나 클릭해서 업로드
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          PDF, PPTX, DOCX, JPG, PNG · 최대 10MB
                        </p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.pptx,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleFileInput}
                    />

                    {isUploading && (
                      <div className="rounded-lg border border-zinc-200 px-4 py-3">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
                          <span>업로드 중...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-zinc-900 transition-all duration-150"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {editFile && !isUploading && (
                      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <span
                          className="text-xl"
                          role="img"
                          aria-label={editFile.type}
                        >
                          {FILE_TYPE_ICONS[editFile.type]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {editFile.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {formatFileSize(editFile.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditFile(null)}
                          aria-label="파일 제거"
                          className="shrink-0 text-zinc-400 hover:text-zinc-600"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          >
                            <path
                              strokeLinecap="round"
                              d="M3 3l10 10M13 3L3 13"
                            />
                          </svg>
                        </button>
                      </div>
                    )}

                    {fileError && (
                      <p className="mt-1.5 text-xs text-red-600">{fileError}</p>
                    )}
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
                      disabled={isUploading}
                      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
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

                  {/* File attachment box */}
                  {post.fileUrl && post.fileName && (
                    <div className="mt-8 rounded-xl border border-zinc-200 p-5">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
                        첨부 파일
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-2xl">
                          <span role="img" aria-label={getFileType(post.fileName)}>
                            {FILE_TYPE_ICONS[getFileType(post.fileName)]}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-zinc-900">
                            {post.fileName}
                          </p>
                          {post.fileSize != null && (
                            <p className="text-sm text-zinc-500">
                              {formatFileSize(post.fileSize)}
                            </p>
                          )}
                        </div>
                        <a
                          href={post.fileUrl}
                          download={post.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                        >
                          다운로드
                        </a>
                      </div>
                    </div>
                  )}

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
