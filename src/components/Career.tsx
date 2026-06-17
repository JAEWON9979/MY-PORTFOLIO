"use client";

import { motion } from "framer-motion";

const careerItems = [
  {
    period: "2023.03 - 현재",
    title: "한신대학교 재학",
    org: "공공인데빅데이터융합학",
    description: "2학년",
  },
  {
    period: "2018.03 - 2020.02",
    title: "직책 / 부서명",
    org: "기관 또는 회사명",
    description: "담당했던 업무 내용을 간략히 작성해주세요.",
  },
];

export default function Career() {
  return (
    <section id="career" className="mx-auto max-w-3xl px-6 py-12">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-2xl font-bold text-zinc-900"
      >
        경력
      </motion.h2>
      <ol className="space-y-8 border-l border-zinc-200 pl-6">
        {careerItems.map((item, index) => (
          <motion.li
            key={item.title + item.period}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative"
          >
            <span className="absolute -left-[31px] top-1.5 h-2 w-2 rounded-full bg-zinc-400" />
            <p className="text-sm text-zinc-500">{item.period}</p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-900">
              {item.title}
            </h3>
            <p className="text-sm text-zinc-500">{item.org}</p>
            <p className="mt-2 text-zinc-700">{item.description}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
