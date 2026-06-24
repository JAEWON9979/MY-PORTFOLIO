"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const PRIMARY_NAV = [
  { label: "소개", href: "/#about" },
  { label: "목표", href: "/goals" },
  { label: "일정", href: "/schedule" },
  { label: "학습기록", href: "/works" },
  { label: "커뮤니티", href: "/community" },
];

const SECONDARY_NAV = [
  { label: "경력", href: "/#career" },
  { label: "자격사항", href: "/#certifications" },
  { label: "역량", href: "/#skills" },
];

export default function Header() {
  const { user, isAdmin, isLoaded, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const closeAll = () => {
    setDropdownOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">

        {/* ── Desktop: primary nav (left) ───────────────────────────────────── */}
        <div className="hidden items-center gap-6 md:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-base font-semibold text-zinc-900 hover:text-zinc-600"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* ── Mobile: hamburger (left) ──────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="메뉴"
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 md:hidden"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" d="M4 4l12 12M16 4L4 16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          )}
        </button>

        {/* ── Desktop: secondary nav + user area (right) ───────────────────── */}
        <div className="hidden items-center gap-6 md:flex">
          {/* secondary nav */}
          <div className="flex items-center gap-5 text-sm text-zinc-600">
            {SECONDARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-zinc-900">
                {item.label}
              </Link>
            ))}
          </div>

          {/* user area */}
          {isLoaded && (
            <>
              {user ? (
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
                  >
                    <span className="max-w-[160px] truncate">{user.email}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className={`shrink-0 transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 5l5 4.5L12 5" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full z-20 mt-1.5 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                      <Link
                        href="/account"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                      >
                        계정 설정
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin/users"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                        >
                          회원 관리
                        </Link>
                      )}
                      <div className="border-t border-zinc-100" />
                      <button
                        type="button"
                        onClick={() => { signOut(); setDropdownOpen(false); }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  로그인
                </Link>
              )}
            </>
          )}
        </div>

        {/* ── Mobile: user area (right, always visible) ────────────────────── */}
        <div className="flex items-center md:hidden">
          {isLoaded && !user && (
            <Link
              href="/auth/login"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              로그인
            </Link>
          )}
          {isLoaded && user && (
            <span className="max-w-[120px] truncate text-xs text-zinc-500">
              {user.email}
            </span>
          )}
        </div>
      </div>

      {/* ── Mobile menu drawer ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-t border-zinc-100 bg-white px-6 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col">
            {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeAll}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {isLoaded && user && (
            <div className="mt-3 flex flex-col border-t border-zinc-100 pt-3">
              <Link
                href="/account"
                onClick={closeAll}
                className="rounded-lg px-2 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                계정 설정
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/users"
                  onClick={closeAll}
                  className="rounded-lg px-2 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  회원 관리
                </Link>
              )}
              <button
                type="button"
                onClick={() => { signOut(); closeAll(); }}
                className="rounded-lg px-2 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
