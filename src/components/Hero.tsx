"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      id="hero"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-sm font-medium text-zinc-500"
      >
        안녕하세요,
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl"
      >
        김재원입니다
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-xl text-base text-zinc-600"
      >
        본 사이트는 개인 포토폴리오 웹 페이지입니다.

      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-2 flex flex-wrap items-center justify-center gap-3"
      >
        <Link
          href="/works"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          작업물 보기
        </Link>
        <a
          href="mailto:rlawodnjs9979@hs.ac.kr"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          연락하기
        </a>
      </motion.div>
    </section>
  );
}
