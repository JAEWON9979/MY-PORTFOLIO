"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorkModal from "@/components/works/WorkModal";
import FileTypeIcon from "@/components/works/FileTypeIcon";
import { useWorks } from "@/hooks/useWorks";
import { useAuth } from "@/hooks/useAuth";

const chipClass =
  "rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function WorkDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { works, isLoaded, updateWork, deleteWork } = useWorks();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editError, setEditError] = useState("");
  const [downloadBlocked, setDownloadBlocked] = useState(false);

  const work = works.find((w) => w.id === params.id) ?? null;

  if (!isLoaded) {
    return (
      <div className="flex flex-1 flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-400">불러오는 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="flex flex-1 flex-col bg-white">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-zinc-500">작업물을 찾을 수 없습니다.</p>
          <Link href="/works" className="text-sm text-zinc-700 underline">
            목록으로 돌아가기
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("이 작업물을 삭제하시겠습니까?")) return;
    setIsDeleting(true);
    try {
      await deleteWork(work.id);
      router.push("/works");
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-12">
          {/* Back */}
          <Link
            href="/works"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 3L5 8l5 5" />
            </svg>
            목록으로
          </Link>

          {/* Thumbnail */}
          {work.thumbnailUrl && (
            <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-3xl bg-zinc-100">
              <Image
                src={work.thumbnailUrl}
                alt={work.title}
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Category + file type badge */}
          <div className="mt-6 flex items-center gap-2">
            <span className={chipClass}>{work.category}</span>
            <span className={chipClass}>{work.fileType}</span>
          </div>

          {/* Title */}
          <h1 className="mt-3 text-2xl font-bold text-zinc-900">{work.title}</h1>

          {/* Date */}
          <p className="mt-1.5 text-sm tabular-nums text-zinc-500">{work.date}</p>

          {/* Tech tags */}
          {work.techTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {work.techTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {work.description && (
            <p className="mt-6 leading-relaxed whitespace-pre-wrap text-zinc-700">
              {work.description}
            </p>
          )}

          {/* File attachment box */}
          {work.fileName && work.linkUrl && (
            <div className="mt-8 rounded-3xl bg-zinc-50 p-6">
              <p className="mb-4 text-xs font-medium text-zinc-500">
                첨부 파일
              </p>
              <div className="flex items-center gap-4">
                <FileTypeIcon type={work.fileType} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-900">
                    {work.fileName}
                  </p>
                  {work.fileSize != null && (
                    <p className="text-sm text-zinc-500">
                      {formatFileSize(work.fileSize)}
                    </p>
                  )}
                </div>
                {isAdmin || work.fileIsPublic ? (
                  <a
                    href={work.linkUrl}
                    download={work.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    다운로드
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDownloadBlocked(true)}
                    className="shrink-0 rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-100"
                  >
                    다운로드
                  </button>
                )}
              </div>
              {downloadBlocked && (
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-sm text-zinc-600">
                  <span>다운로드 권한이 필요합니다.</span>
                  <button
                    type="button"
                    onClick={() => setDownloadBlocked(false)}
                    className="ml-4 text-xs text-zinc-400 hover:text-zinc-600"
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <div className="mt-8 flex gap-2 border-t border-zinc-100 pt-6">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
              >
                수정
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-full bg-red-50 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />

      {isEditing && (
        <WorkModal
          initialWork={work}
          onClose={() => { setIsEditing(false); setEditError(""); }}
          onSubmit={async (input) => {
            setEditError("");
            try {
              await updateWork(work.id, input);
              setIsEditing(false);
            } catch {
              setEditError("저장에 실패했습니다. 다시 시도해주세요.");
            }
          }}
          submitError={editError}
        />
      )}
    </div>
  );
}
