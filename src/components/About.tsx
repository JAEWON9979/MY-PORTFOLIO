"use client";

import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-3xl px-6 py-20">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6 text-2xl font-bold text-zinc-900"
      >
        소개
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="leading-7 text-zinc-700"
      >
        자기소개 내용을 입력해주세요. 성장 배경, 가치관, 업무를 대하는 태도
        등을 자유롭게 작성할 수 있습니다.
      </motion.p>
    </section>
  );
}
