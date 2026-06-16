"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section
      id="hero"
      className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center"
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
        이름입니다
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-xl text-base text-zinc-600"
      >
        한 줄 소개를 입력해주세요. (예: 책임감을 바탕으로 행정 업무를 수행해온
        OOO입니다.)
      </motion.p>
    </section>
  );
}
