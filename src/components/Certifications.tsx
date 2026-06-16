"use client";

import { motion } from "framer-motion";
import { certifications } from "@/data/portfolio";

export default function Certifications() {
  return (
    <section id="certifications" className="mx-auto max-w-3xl px-6 py-20">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-2xl font-bold text-zinc-900"
      >
        자격사항
      </motion.h2>
      <ol className="space-y-8 border-l border-zinc-200 pl-6">
        {certifications.map((item, index) => (
          <motion.li
            key={item.name + item.acquiredDate}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative"
          >
            <span className="absolute -left-[31px] top-1.5 h-2 w-2 rounded-full bg-zinc-400" />
            <p className="text-sm text-zinc-500">{item.acquiredDate}</p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-900">
              {item.name}
            </h3>
            <p className="text-sm text-zinc-500">{item.issuer}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
