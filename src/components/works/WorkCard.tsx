"use client";

import type { Work } from "@/hooks/useWorks";

interface WorkCardProps {
  work: Work;
}

const categoryStyles: Record<Work["category"], string> = {
  수업과제: "bg-blue-50 text-blue-700",
  개인실습: "bg-amber-50 text-amber-700",
  팀프로젝트: "bg-purple-50 text-purple-700",
};

const fileTypeIcon: Record<Work["fileType"], string> = {
  PDF: "📄",
  PPTX: "📊",
  기타: "📁",
};

export default function WorkCard({ work }: WorkCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${categoryStyles[work.category]}`}
        >
          {work.category}
        </span>
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

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-zinc-500">{work.date}</span>
        <a
          href={work.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
        >
          바로가기
        </a>
      </div>
    </div>
  );
}
