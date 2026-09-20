"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Noto_Serif_KR } from "next/font/google";
import { BOOK_INTRO_KEY } from "@/lib/bookIntro";

// 홈 입장 인트로: 흰 표지가 왼쪽 책등을 축으로 열리며 이미 그려진 홈이 드러난다.
// 표지 오른쪽 아래에는 종이 모서리가 말려 올라간 그림(CurledCorner)이 정지된 채 들어 있다.
// - 세션당 1번만(sessionStorage), "동작 줄이기" 사용자는 생략
// - 표지를 HOLD_MS(3초) 동안 보여준 뒤 저절로 열림, 그 전에 클릭/아무 키를 누르면 바로 열림(Esc는 즉시 건너뜀)
// - 서버가 표지를 먼저 그려 두므로 첫 방문 때 홈이 깜빡이지 않고,
//   재방문은 layout의 스크립트가 html[data-intro-skip]로 미리 숨김

// 표지 글씨용 서체: 책 표지 느낌의 명조. 표지 글자에 쓰이는 조각만 내려받음(preload 없음)
const coverFont = Noto_Serif_KR({
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const HOLD_MS = 3000; // 표지를 보여준 뒤 저절로 열리기까지
const OPEN_SECONDS = 1.0; // 표지가 열리는 시간

const subscribe = () => () => {};
function getSeen(): boolean {
  try {
    return sessionStorage.getItem(BOOK_INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

// 오른쪽 아래 모서리가 말려 올라간 종이. 100×140 좌표계에서 (100,140)이 표지의 꼭짓점.
// CURL_EDGE는 오른쪽 위에서 시작해 왼쪽의 뾰족한 끝(꼭짓점)을 돌아 아래로 내려오는 말림 윤곽이고,
// 그 오른쪽(CURL_WEDGE)은 종이가 벗겨져 아래가 비쳐 보이는 자리.
const CURL_EDGE = "M98 4 C76 10 44 26 26 52 C32 70 44 100 66 140";
const CURL_WEDGE = `${CURL_EDGE} L100 140 L100 4 Z`;
const CURL_OUTSIDE = `M-60 -60 H160 V200 H-60 Z ${CURL_WEDGE}`;

function CurledCorner() {
  return (
    <svg
      viewBox="0 0 100 140"
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 right-0 overflow-visible"
      style={{ width: "clamp(130px, 22vw, 290px)", aspectRatio: "100 / 140" }}
    >
      <defs>
        {/* 벗겨져 드러난 자리의 음영: 말림 윤곽 가까이가 짙고 모서리 쪽으로 옅어짐 */}
        <linearGradient id="curl-revealed" x1="30" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000000" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.02" />
        </linearGradient>
        <clipPath id="curl-wedge">
          <path d={CURL_WEDGE} />
        </clipPath>
        <clipPath id="curl-outside">
          <path d={CURL_OUTSIDE} clipRule="evenodd" />
        </clipPath>
        <filter id="curl-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* 벗겨져 드러난 자리 */}
      <path d={CURL_WEDGE} fill="url(#curl-revealed)" />
      {/* 말린 종이가 드러난 자리에 드리우는 그림자 */}
      <g clipPath="url(#curl-wedge)">
        <path d={CURL_EDGE} fill="none" stroke="#000000" strokeOpacity="0.16" strokeWidth="6" filter="url(#curl-blur)" />
      </g>
      {/* 말린 종이 바깥쪽의 둥근 음영 */}
      <g clipPath="url(#curl-outside)">
        <path d={CURL_EDGE} fill="none" stroke="#000000" strokeOpacity="0.08" strokeWidth="8" filter="url(#curl-blur)" />
      </g>
      {/* 표지 아래쪽에 깔리는 옅은 그림자 */}
      <ellipse cx="36" cy="146" rx="46" ry="11" fill="#000000" fillOpacity="0.07" filter="url(#curl-blur)" />
      {/* 말림 윤곽선 */}
      <path d={CURL_EDGE} fill="none" stroke="#000000" strokeOpacity="0.14" strokeWidth="0.45" />
    </svg>
  );
}

export default function BookIntro() {
  const reduceMotion = useReducedMotion();
  // 서버 스냅샷은 항상 false → 서버 HTML에는 표지가 들어 있고, 클라이언트에서 실제 값으로 교정됨
  const seen = useSyncExternalStore(subscribe, getSeen, () => false);
  const [phase, setPhase] = useState<"cover" | "open" | "done">("cover");
  const active = !seen && !reduceMotion && phase !== "done";

  // 표지를 보여준 뒤 열기 시작
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

  // 인트로 동안 스크롤 잠금 + 클릭/키 입력으로 바로 열기(Esc는 즉시 건너뛰기)
  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const openNow = () => setPhase((p) => (p === "cover" ? "open" : p));
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPhase("done");
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return; // 새로고침 같은 단축키는 그대로
      openNow();
    };
    window.addEventListener("pointerdown", openNow);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("pointerdown", openNow);
      window.removeEventListener("keydown", onKeyDown);
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
            className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/5 to-transparent"
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === "open" ? 0 : 1 }}
            transition={{ duration: OPEN_SECONDS, ease: "easeOut" }}
          />

          {/* 표지 */}
          <motion.div
            className={`${coverFont.className} absolute inset-0 flex items-center justify-center bg-white shadow-[0_0_60px_rgba(0,0,0,0.25)]`}
            style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: phase === "open" ? -180 : 0 }}
            transition={{ duration: OPEN_SECONDS, ease: [0.65, 0, 0.35, 1] }}
            onAnimationComplete={() => {
              if (phase === "open") setPhase("done");
            }}
          >
            {/* 책등 */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/15 to-transparent" />

            <div className="text-center">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-xs font-normal tracking-[0.3em] text-black"
              >
                JAEWON&apos;S PORTFOLIO
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mt-4 text-4xl font-bold tracking-tight text-black sm:text-5xl"
              >
                김재원
              </motion.p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mx-auto mt-6 h-px w-12 bg-black/40"
              />
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute bottom-8 text-xs text-zinc-500"
            >
              화면을 누르면 바로 넘어갑니다
            </motion.p>

            <CurledCorner />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
