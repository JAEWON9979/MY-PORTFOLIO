"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePosts, type PostCategory } from "@/hooks/usePosts";
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

export default function CommunityWritePage() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const { addPost } = usePosts();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("자유");
  const [error, setError] = useState("");

  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/auth/login");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) return null;

  const displayName =
    (user.user_metadata?.username as string | undefined) ?? user.email ?? "익명";

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

      setCurrentFile({
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
        fileUrl: currentFile?.url ?? null,
        fileName: currentFile?.name ?? null,
        fileSize: currentFile?.size ?? null,
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

            {/* File attachment */}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                파일 첨부 (선택)
              </label>

              {!currentFile && !isUploading && (
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

              {currentFile && !isUploading && (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <span
                    className="text-xl"
                    role="img"
                    aria-label={currentFile.type}
                  >
                    {FILE_TYPE_ICONS[currentFile.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {currentFile.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatFileSize(currentFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentFile(null)}
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
                  disabled={isUploading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
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
