import type { WorkFileType } from "@/hooks/useWorks";

const SIZES = {
  sm: { tile: "h-8 w-8 rounded-lg", icon: 16 },
  md: { tile: "h-9 w-9 rounded-xl", icon: 18 },
  lg: { tile: "h-12 w-12 rounded-2xl", icon: 22 },
} as const;

// 파일 형식별 단색 라인 아이콘 (PDF·DOCX는 문서, PPTX는 발표 자료, 기타는 폴더)
export default function FileTypeIcon({
  type,
  size = "md",
}: {
  type: WorkFileType;
  size?: keyof typeof SIZES;
}) {
  const { tile, icon } = SIZES[size];
  return (
    <span
      role="img"
      aria-label={type}
      title={type}
      className={`flex shrink-0 items-center justify-center bg-zinc-200/70 text-zinc-600 ${tile}`}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {type === "PPTX" ? (
          <>
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M12 16v4M8 20h8M8 12V9M12 12V7M16 12v-2" />
          </>
        ) : type === "기타" ? (
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        ) : (
          <>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M9 13h6M9 17h6" />
          </>
        )}
      </svg>
    </span>
  );
}
