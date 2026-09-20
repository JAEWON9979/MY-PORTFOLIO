"use client";

interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

// 목록 행의 수정·삭제 아이콘 버튼. 부모 행에 `group` 클래스가 있어야 한다.
// 데스크톱에선 행에 hover/포커스했을 때만 보이고, 터치 화면에선 항상 보인다.
export default function RowActions({ onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex shrink-0 gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
      <button
        type="button"
        onClick={onEdit}
        aria-label="수정"
        title="수정"
        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white hover:text-zinc-800"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.3 2.3a1.5 1.5 0 0 1 2.1 2.1l-7.6 7.6-2.6.6.6-2.6 7.5-7.7z"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="삭제"
        title="삭제"
        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white hover:text-red-600"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.5 4h11M6 4V2.8c0-.4.3-.8.8-.8h2.4c.5 0 .8.4.8.8V4M4 4l.6 8.4c0 .9.7 1.6 1.6 1.6h3.6c.9 0 1.6-.7 1.6-1.6L12 4"
          />
        </svg>
      </button>
    </div>
  );
}
