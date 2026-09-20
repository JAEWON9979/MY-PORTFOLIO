"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";

const pillars = [
  {
    label: "기본",
    title: "행정 역량",
    description: "문서 작성, 공문 처리, 민원 대응 등 행정 업무의 기본기",
    emphasized: false,
  },
  {
    label: "결합 목표",
    title: "AI 역량",
    description: "행정 업무에 AI를 접목하는 것을 목표로 합니다",
    emphasized: true,
  },
];

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
        className="text-lg leading-8 text-zinc-800"
      >
        안녕하세요. 행정 관련 직종을 희망하고 있는{" "}
        <strong className="font-semibold text-zinc-900">김재원</strong>입니다.
      </motion.p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
        {pillars.map((pillar, index) => (
          <Fragment key={pillar.title}>
            {index > 0 && (
              <span
                aria-hidden
                className="self-center text-xl font-semibold text-zinc-400"
              >
                +
              </span>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`rounded-2xl border p-5 sm:flex-1 ${
                pillar.emphasized
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200"
              }`}
            >
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  pillar.emphasized
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {pillar.label}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">
                {pillar.title}
              </h3>
              <p className="mt-1.5 break-keep text-sm leading-6 text-zinc-600">
                {pillar.description}
              </p>
            </motion.div>
          </Fragment>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-6 text-sm leading-6 text-zinc-500"
      >
        행정역량을 기본으로 AI역량을 결합하는것을 목표하고 있습니다.
      </motion.p>
    </section>
  );
}
