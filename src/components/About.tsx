"use client";

import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-3xl px-6 py-12">
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
        안녕하세요. 행정 관련 직종을 희망하고 있는 김재원입니다. 행정역량을 기본으로 AI역량을 결합하는것을 목표하고 있습니다.
      </motion.p>
    </section>
  );
}
