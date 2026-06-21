"use client";

import { useRouter } from "next/navigation";
import type { Work } from "@/hooks/useWorks";

const categoryStyles: Record<Work["category"], string> = {
  수업과제: "bg-blue-50 text-blue-700",
  개인실습: "bg-amber-50 text-amber-700",
  팀프로젝트: "bg-purple-50 text-purple-700",
};

const fileTypeIcon: Record<Work["fileType"], string> = {
  PDF: "📄",
  PPTX: "📊",
  DOCX: "📝",
  기타: "📁",
};

export default function WorkCard({
  work,
  isAdmin = false,
}: {
  work: Work;
  isAdmin?: boolean;
}) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/works/${work.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") router.push(`/works/${work.id}`);
      }}
      className="flex cursor-pointer flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${categoryStyles[work.category]}`}
          >
            {work.category}
          </span>
          {isAdmin && !work.isPublic && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-white">
              비공개
            </span>
          )}
        </div>
        <span
          className="text-lg"
          role="img"
          aria-label={work.fileType}
          title={work.fileType}
        >
          {fileTypeIcon[work.fileType]}
        </span>
      </div>

      <h3 className="text-base font-semibold text-zinc-900">{work.title}</h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-zinc-600">
        {work.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {work.techTags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-4 text-xs text-zinc-500">{work.date}</p>
    </div>
  );
}
