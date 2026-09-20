"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import GoalRing from "./GoalRing";
import { useGoals, type Goal, type GoalCategory } from "@/hooks/useGoals";
import { useWorks } from "@/hooks/useWorks";
import FileTypeIcon from "@/components/works/FileTypeIcon";
import { usePosts } from "@/hooks/usePosts";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { useDdays } from "@/hooks/useDdays";
import { daysBetween, formatDday, formatMonthDayWeekday, kstToday } from "@/lib/date";

// ── helpers ───────────────────────────────────────────────────────────────────

// 작성자 아바타는 색 없이 통일 (닉네임 첫 글자만 표시)
const AVATAR_CLASS = "bg-zinc-200/70 text-zinc-700";

function relativeTime(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "방금 전";
  if (secs < 3600) return `${Math.floor(secs / 60)}분 전`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}시간 전`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}일 전`;
  return `${Math.floor(secs / 604800)}주 전`;
}

function catCount(goals: Goal[], cat: GoalCategory) {
  const list = goals.filter((g) => g.category === cat);
  return { done: list.filter((g) => g.isCompleted).length, total: list.length };
}

// ── sub-components ────────────────────────────────────────────────────────────

function CardShell({
  title,
  href,
  delay = 0,
  children,
}: {
  title: string;
  href: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      // hover 효과는 translate/box-shadow만 전환해 framer-motion의 transform 애니메이션과 겹치지 않게 함
      className="flex flex-col rounded-3xl bg-zinc-50 p-6 transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <Link
          href={href}
          className="text-xs text-zinc-400 hover:text-zinc-700"
        >
          전체 보기 →
        </Link>
      </div>
      {children}
    </motion.div>
  );
}

// ── GoalCard ──────────────────────────────────────────────────────────────────

function GoalCard() {
  const { user, isLoaded: authLoaded } = useAuth();
  const { goals, isLoaded } = useGoals();

  const stats = useMemo(() => {
    const total = goals.length;
    const done = goals.filter((g) => g.isCompleted).length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    return {
      rate,
      일목표: catCount(goals, "일목표"),
      주목표: catCount(goals, "주목표"),
      연목표: catCount(goals, "연목표"),
    };
  }, [goals]);

  function CatRow({ cat }: { cat: GoalCategory }) {
    const { done, total } = stats[cat];
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-zinc-900">{cat}</span>
        <span className="text-zinc-500">
          {done}
          <span className="text-zinc-300">/{total}</span>
        </span>
      </div>
    );
  }

  return (
    <CardShell title="목표 달성률" href="/goals" delay={0.1}>
      {!isLoaded || !authLoaded ? (
        <div className="flex h-24 items-center justify-center">
          <p className="text-xs text-zinc-400">불러오는 중...</p>
        </div>
      ) : !user ? (
        <div className="flex h-24 flex-col items-center justify-center gap-2">
          <p className="text-xs text-zinc-500">로그인 후 확인할 수 있습니다.</p>
          <Link
            href="/auth/login"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
          >
            로그인
          </Link>
        </div>
      ) : goals.length === 0 ? (
        <div className="flex h-24 items-center justify-center">
          <p className="text-xs text-zinc-400">아직 등록된 목표가 없습니다.</p>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <GoalRing rate={stats.rate} />
          <div className="flex flex-1 flex-col gap-2">
            {(["일목표", "주목표", "연목표"] as GoalCategory[]).map((cat) => (
              <CatRow key={cat} cat={cat} />
            ))}
          </div>
        </div>
      )}
    </CardShell>
  );
}

// ── DdayCard ──────────────────────────────────────────────────────────────────

// 일정에서 "D-DAY로 표시"한 것 중 가장 가까운 3개. 본인 일정이라 비로그인이면 카드 자체를 숨김
function DdayCard() {
  const { user, isLoaded: authLoaded } = useAuth();
  const { ddays, isLoaded } = useDdays(3);

  if (!authLoaded || !user) return null;

  const today = kstToday();

  return (
    <div className="mb-5">
      <CardShell title="D-DAY" href="/schedule" delay={0.15}>
        {!isLoaded ? (
          <div className="flex h-16 items-center justify-center">
            <p className="text-xs text-zinc-400">불러오는 중...</p>
          </div>
        ) : ddays.length === 0 ? (
          <div className="flex h-16 items-center justify-center">
            <p className="text-xs text-zinc-400">
              일정에서 &quot;D-DAY로 표시&quot;를 체크하면 여기에 나타납니다.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ddays.map((d) => (
              <li key={d.id} className="rounded-2xl bg-white px-4 py-3">
                <p className="text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
                  {formatDday(daysBetween(d.date, today))}
                </p>
                <p className="mt-1 truncate text-sm font-medium text-zinc-900">{d.title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{formatMonthDayWeekday(d.date)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardShell>
    </div>
  );
}

// ── WorksCard ─────────────────────────────────────────────────────────────────

function WorksCard() {
  const { works, isLoaded } = useWorks();
  const router = useRouter();

  const recent = useMemo(() => works.slice(0, 3), [works]);

  return (
    <CardShell title="최근 학습기록" href="/works" delay={0.2}>
      {!isLoaded ? (
        <div className="flex h-24 items-center justify-center">
          <p className="text-xs text-zinc-400">불러오는 중...</p>
        </div>
      ) : recent.length === 0 ? (
        <div className="flex h-24 items-center justify-center">
          <p className="text-xs text-zinc-400">아직 등록된 항목이 없습니다.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {recent.map((work) => (
            <li key={work.id}>
              <button
                type="button"
                onClick={() => router.push(`/works/${work.id}`)}
                className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-white"
              >
                <FileTypeIcon type={work.fileType} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                  {work.title}
                </span>
                <span className="shrink-0 text-xs text-zinc-400">{work.date}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
}

// ── CommunityCard ─────────────────────────────────────────────────────────────

function CommunityCard() {
  const { posts, isLoaded } = usePosts();
  const { comments } = useComments();
  const router = useRouter();

  const recent = useMemo(() => posts.slice(0, 3), [posts]);

  return (
    <CardShell title="커뮤니티 최신 글" href="/community" delay={0.1}>
      {!isLoaded ? (
        <div className="flex h-16 items-center justify-center">
          <p className="text-xs text-zinc-400">불러오는 중...</p>
        </div>
      ) : recent.length === 0 ? (
        <div className="flex h-16 items-center justify-center">
          <p className="text-xs text-zinc-400">아직 등록된 글이 없습니다.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200/70">
          {recent.map((post) => {
            const count = comments.filter((c) => c.postId === post.id).length;
            const initial = post.authorName.charAt(0);
            return (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/community/${post.id}`)}
                  className="flex w-full items-center gap-3 py-3 text-left hover:bg-white rounded-lg px-1"
                >
                  {/* avatar */}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_CLASS}`}
                  >
                    {initial}
                  </span>
                  {/* title + meta */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {post.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {post.authorName} · {relativeTime(post.createdAt)}
                    </p>
                  </div>
                  {/* comment count */}
                  <span className="shrink-0 flex items-center gap-1 text-xs text-zinc-400">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M1 2.5A1.5 1.5 0 012.5 1h7A1.5 1.5 0 0111 2.5v5A1.5 1.5 0 019.5 9H7l-3 2V9H2.5A1.5 1.5 0 011 7.5v-5z"
                      />
                    </svg>
                    {count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </CardShell>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

export default function RecentActivity() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6 text-2xl font-bold text-zinc-900"
      >
        최근 활동
      </motion.h2>

      {/* top row: goal ring + recent works */}
      <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <GoalCard />
        <WorksCard />
      </div>

      {/* D-DAY (로그인한 본인만) */}
      <DdayCard />

      {/* bottom row: community */}
      <CommunityCard />
    </section>
  );
}
