import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "일정",
  description: "캘린더에서 일정을 관리하고 반복 일정을 등록합니다.",
};

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
