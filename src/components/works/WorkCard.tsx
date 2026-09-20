"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import FileTypeIcon from "@/components/works/FileTypeIcon";
import type { Work } from "@/hooks/useWorks";

const chipClass =
  "rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200";

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
      // hover 전환은 translate/box-shadow만 지정해 부모 motion 요소의 transform 애니메이션과 겹치지 않게 함
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl bg-zinc-50 transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
    >
      {work.thumbnailUrl && (
        <div className="relative aspect-video w-full bg-zinc-200">
          <Image
            src={work.thumbnailUrl}
            alt={work.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={chipClass}>{work.category}</span>
            {isAdmin && !work.isPublic && (
              <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white">
                비공개
              </span>
            )}
          </div>
          <FileTypeIcon type={work.fileType} size="sm" />
        </div>

        <h3 className="text-base font-semibold text-zinc-900">{work.title}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-6 text-zinc-600">
          {work.description}
        </p>

        {work.techTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {work.techTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-200/60 px-2.5 py-0.5 text-xs text-zinc-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="mt-5 text-xs tabular-nums text-zinc-400">{work.date}</p>
      </div>
    </div>
  );
}
