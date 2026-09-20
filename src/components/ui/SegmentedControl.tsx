"use client";

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

// 회색 트랙 위에서 선택된 항목만 흰 알약으로 떠 있는 분할 컨트롤 (목표·학습기록 필터 공용)
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full bg-zinc-100 p-1">
      {options.map((option) => {
        const isActive = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={isActive}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
