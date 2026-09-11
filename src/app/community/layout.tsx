import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "커뮤니티",
  description: "자유롭게 글을 남기고 소통하는 공간입니다.",
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
