"use client";

interface DeleteConfirmDialogProps {
  onCancel: () => void;
  onDeleteOne: () => void;
  onDeleteSeries: () => void;
}

export default function DeleteConfirmDialog({
  onCancel,
  onDeleteOne,
  onDeleteSeries,
}: DeleteConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-lg font-bold text-zinc-900">반복 일정 삭제</h2>
        <p className="mb-5 text-sm text-zinc-600">
          이 일정은 반복 일정의 일부입니다. 이 일정만 삭제하시겠습니까, 전체 반복 일정을
          삭제하시겠습니까?
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onDeleteOne}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            이 일정만 삭제
          </button>
          <button
            type="button"
            onClick={onDeleteSeries}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            전체 반복 삭제
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
