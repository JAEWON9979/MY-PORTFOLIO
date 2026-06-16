"use client";

import Link from "next/link";

const navItems = [
  { label: "경력", href: "/#career" },
  { label: "자격사항", href: "/#certifications" },
  { label: "역량", href: "/#skills" },
];

export default function Header() {
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
        <ul className="flex gap-6 text-sm text-zinc-600">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="hover:text-zinc-900">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
