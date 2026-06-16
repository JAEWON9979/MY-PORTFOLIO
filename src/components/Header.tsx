"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "경력", href: "/#career" },
  { label: "자격사항", href: "/#certifications" },
  { label: "역량", href: "/#skills" },
];

export default function Header() {
  const { user, isLoaded, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/#about"
            className="text-base font-semibold text-zinc-900"
          >
            소개
          </Link>
          <Link href="/goals" className="text-base font-semibold text-zinc-900">
            목표
          </Link>
          <Link href="/works" className="text-base font-semibold text-zinc-900">
            학습기록
          </Link>
          <Link
            href="/community"
            className="text-base font-semibold text-zinc-900"
          >
            커뮤니티
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <ul className="flex gap-6 text-sm text-zinc-600">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-zinc-900">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {isLoaded && (
            <div className="flex items-center gap-3 text-sm">
              {user ? (
                <>
                  <span className="text-zinc-600">{user.email}</span>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="rounded-lg bg-zinc-100 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-200"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-800"
                >
                  로그인
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
