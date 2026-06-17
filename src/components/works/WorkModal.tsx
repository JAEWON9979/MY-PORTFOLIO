"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Work, WorkCategory, WorkFileType, WorkInput } from "@/hooks/useWorks";

const categoryOptions: WorkCategory[] = ["수업과제", "개인실습", "팀프로젝트"];

const fileTypeIcon: Record<WorkFileType, string> = {
  PDF: "📄",
  PPTX: "📊",
  DOCX: "📝",
  기타: "📁",
};

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: WorkFileType;
}

interface WorkModalProps {
  initialWork?: Work | null;
  onClose: () => void;
  onSubmit: (input: WorkInput) => void;
  submitError?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeFromName(filename: string): WorkFileType {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  if (ext === ".pdf") return "PDF";
  if (ext === ".pptx") return "PPTX";
  if (ext === ".docx") return "DOCX";
  return "기타";
}

export default function WorkModal({ initialWork, onClose, onSubmit, submitError }: WorkModalProps) {
  const [title, setTitle] = useState(initialWork?.title ?? "");
  const [category, setCategory] = useState<WorkCategory>(
    initialWork?.category ?? "수업과제"
  );
  const [description, setDescription] = useState(initialWork?.description ?? "");
  const [techTagsText, setTechTagsText] = useState(
    initialWork?.techTags.join(", ") ?? ""
  );
  const [date, setDate] = useState(initialWork?.date ?? "");

  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(
    initialWork?.fileName
      ? {
          url: initialWork.linkUrl,
          name: initialWork.fileName,
          size: initialWork.fileSize ?? 0,
          type: initialWork.fileType,
        }
      : null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleFile = async (file: File) => {
    setFileError("");

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (![".pdf", ".pptx", ".docx"].includes(ext)) {
      setFileError("PDF, PPTX, DOCX 파일만 업로드 가능합니다.");
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

      // Build a Storage-safe key: timestamp + random hex + extension only.
      // Original filename (Korean included) goes into file_name column, not the key.
      const rand = Math.random().toString(36).slice(2, 7);
      const storagePath = `${Date.now()}-${rand}${ext}`;
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
          `${projectUrl}/storage/v1/object/works-files/${storagePath}`
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
        .from("works-files")
        .getPublicUrl(storagePath);

      setCurrentFile({
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: getFileTypeFromName(file.name),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const techTags = techTagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      title,
      category,
      description,
      techTags,
      fileType: currentFile?.type ?? "기타",
      linkUrl: currentFile?.url ?? "",
      fileName: currentFile?.name ?? null,
      fileSize: currentFile?.size ?? null,
      date,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-zinc-900">
          {initialWork ? "작업물 수정" : "작업물 추가"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WorkCategory)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            >
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {/* Tech tags */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              사용 기술 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={techTagsText}
              onChange={(e) => setTechTagsText(e.target.value)}
              placeholder="Python, Pandas"
              maxLength={200}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              날짜
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              첨부 파일
            </label>

            {/* Drop zone — shown only when no file and not uploading */}
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
                  PDF, PPTX, DOCX · 최대 10MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.pptx,.docx"
              className="hidden"
              onChange={handleFileInput}
            />

            {/* Upload progress bar */}
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

            {/* Uploaded file info */}
            {currentFile && !isUploading && (
              <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <span
                  className="text-xl"
                  role="img"
                  aria-label={currentFile.type}
                >
                  {fileTypeIcon[currentFile.type]}
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
                    <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
                  </svg>
                </button>
              </div>
            )}

            {fileError && (
              <p className="mt-1.5 text-xs text-red-600">{fileError}</p>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
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
      </div>
    </div>
  );
}
