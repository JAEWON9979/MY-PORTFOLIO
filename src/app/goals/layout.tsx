import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "목표",
  description: "일간/주간/연간 목표를 세우고 달성률을 관리합니다.",
};

export default function GoalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
