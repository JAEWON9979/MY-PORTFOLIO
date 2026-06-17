"use client";

import { motion } from "framer-motion";

const skillGroups = [
  {
    title: "행정 업무",
    items: ["문서 작성", "공문 처리", "민원 대응", "일정 관리"],
  },
  {
    title: "사무 도구",
    items: ["한글", "MS Office", "Excel", "PowerPoint"],
  },
  {
    title: "기타 역량",
    items: ["커뮤니케이션", "협업", "꼼꼼함", "책임감"],
  },
];

export default function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-3xl px-6 py-12">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-2xl font-bold text-zinc-900"
      >
        역량
      </motion.h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {skillGroups.map((group, index) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">
              {group.title}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
