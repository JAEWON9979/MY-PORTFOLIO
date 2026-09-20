"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BOOK_INTRO_KEY } from "@/lib/bookIntro";

// 홈 입장 인트로: 진한 표지가 왼쪽 책등을 축으로 열리며 이미 그려진 홈이 드러난다.
// - 세션당 1번만(sessionStorage), "동작 줄이기" 사용자는 생략
// - 클릭/아무 키나 누르면 바로 건너뜀
// - 서버가 표지를 먼저 그려 두므로 첫 방문 때 홈이 깜빡이지 않고,
//   재방문은 layout의 스크립트가 html[data-intro-skip]로 미리 숨김

const HOLD_MS = 700; // 표지를 보여주는 시간
const OPEN_SECONDS = 1.0; // 표지가 열리는 시간

const subscribe = () => () => {};
function getSeen(): boolean {
  try {
    return sessionStorage.getItem(BOOK_INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

export default function BookIntro() {
  const reduceMotion = useReducedMotion();
  // 서버 스냅샷은 항상 false → 서버 HTML에는 표지가 들어 있고, 클라이언트에서 실제 값으로 교정됨
  const seen = useSyncExternalStore(subscribe, getSeen, () => false);
  const [phase, setPhase] = useState<"cover" | "open" | "done">("cover");
  const active = !seen && !reduceMotion && phase !== "done";

  // 표지를 잠깐 보여준 뒤 열기 시작
  useEffect(() => {
    if (!active || phase !== "cover") return;
    const timer = setTimeout(() => setPhase("open"), HOLD_MS);
    return () => clearTimeout(timer);
  }, [active, phase]);

  // 인트로가 끝나면 본 것으로 기록
  useEffect(() => {
    if (phase !== "done") return;
    try {
      sessionStorage.setItem(BOOK_INTRO_KEY, "1");
    } catch {
      /* 저장 실패해도 인트로만 다시 보일 뿐 */
    }
  }, [phase]);

  // 인트로 동안 스크롤 잠금 + 클릭/키 입력으로 건너뛰기
  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const skip = () => setPhase("done");
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="book-intro"
          data-book-intro
          aria-hidden="true"
          className="fixed inset-0 z-[100] cursor-pointer overflow-hidden"
          // 원근감이 화면 너비에 비례해야 넓은 화면에서도 표지 끝이 과하게 커지지 않고 서서히 열려 보임
          style={{ perspective: "max(2200px, 350vw)" }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          {/* 표지가 열리며 드러나는 홈 위에 드리우는 그림자 (열리는 동안 옅어짐) */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent"
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === "open" ? 0 : 1 }}
            transition={{ duration: OPEN_SECONDS, ease: "easeOut" }}
          />

          {/* 표지 */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-zinc-900"
            style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: phase === "open" ? -180 : 0 }}
            transition={{ duration: OPEN_SECONDS, ease: [0.65, 0, 0.35, 1] }}
            onAnimationComplete={() => {
              if (phase === "open") setPhase("done");
            }}
          >
            {/* 책등 */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/60 to-transparent" />
            {/* 표지 안쪽 테두리 */}
            <div className="pointer-events-none absolute inset-6 rounded-3xl border border-white/10 sm:inset-10" />

            <div className="text-center">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-xs font-medium tracking-[0.3em] text-zinc-500"
              >
                JAEWON&apos;S PORTFOLIO
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl"
              >
                김재원
              </motion.p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mx-auto mt-6 h-px w-12 bg-white/30"
              />
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute bottom-8 text-xs text-zinc-600"
            >
              화면을 누르면 건너뜁니다
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
