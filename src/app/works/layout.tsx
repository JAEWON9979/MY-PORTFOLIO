import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "작업물",
  description: "그동안 진행한 학습 기록과 프로젝트를 모아봤습니다.",
};

export default function WorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
