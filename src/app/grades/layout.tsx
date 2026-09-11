import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "학점",
  description: "학기별 과목과 평점을 관리합니다.",
};

export default function GradesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
