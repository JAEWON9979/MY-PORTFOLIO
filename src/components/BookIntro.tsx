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

// 오른쪽 아래 모서리가 안쪽으로 접혀 올라온 종이. 471×442 좌표계에서 (471,442)가 표지의 꼭짓점.
// - CURL_FOLD: 종이가 접히는 대각선(오른쪽 위 → 왼쪽 아래). 그 오른쪽은 종이가 벗겨져 아래가 비치는 자리
// - CURL_EDGE: 접혀 올라온 뒷면(잎 모양)의 안쪽 윤곽. 왼쪽에 뾰족한 끝이 있고 위쪽은 완만하게, 아래쪽은 둥글게 내려옴
// - CURL_FLAP: EDGE와 FOLD 사이, 접혀 올라온 뒷면
const CURL_EDGE = "M470 36 C408 84 290 110 208 148 C226 215 215 330 112 442";
const CURL_FOLD = "M470 36 Q307 261 112 442";
const CURL_FLAP = `${CURL_EDGE} Q307 261 470 36 Z`;
const CURL_REVEALED = `${CURL_FOLD} L471 442 L471 36 Z`;
const CURL_OUTSIDE = `M-200 -200 H700 V700 H-200 Z ${CURL_FLAP}`;

function CurledCorner() {
  return (
    <svg
      viewBox="0 0 471 442"
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 right-0 overflow-visible"
      style={{ width: "clamp(150px, 31vw, 430px)", aspectRatio: "471 / 442" }}
    >
      <defs>
        {/* 접혀 올라온 뒷면: 안쪽 윤곽 쪽은 밝고 접히는 선 쪽이 살짝 어두움 */}
        <linearGradient id="curl-back" x1="200" y1="140" x2="380" y2="330" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#fcfcfc" />
          <stop offset="1" stopColor="#e9e9ec" />
        </linearGradient>
        {/* 벗겨져 드러난 자리: 접히는 선 가까이가 짙고 모서리 쪽으로 옅어짐 */}
        <linearGradient id="curl-revealed" x1="300" y1="250" x2="471" y2="442" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000000" stopOpacity="0.13" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.04" />
        </linearGradient>
        <clipPath id="curl-revealed-clip">
          <path d={CURL_REVEALED} />
        </clipPath>
        <clipPath id="curl-outside-clip">
          <path d={CURL_OUTSIDE} clipRule="evenodd" />
        </clipPath>
        <filter id="curl-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      {/* 벗겨져 드러난 자리 + 접힌 종이가 드리우는 그림자 */}
      <path d={CURL_REVEALED} fill="url(#curl-revealed)" />
      <g clipPath="url(#curl-revealed-clip)">
        <path d={CURL_FOLD} fill="none" stroke="#000000" strokeOpacity="0.16" strokeWidth="30" filter="url(#curl-blur)" />
      </g>
      {/* 표지 앞면 아래쪽에 깔리는 옅은 그림자 */}
      <ellipse cx="120" cy="480" rx="230" ry="70" fill="#000000" fillOpacity="0.07" filter="url(#curl-blur)" />
      {/* 접혀 올라온 뒷면이 표지 앞면에 드리우는 그림자 */}
      <g clipPath="url(#curl-outside-clip)">
        <path d={CURL_EDGE} fill="none" stroke="#000000" strokeOpacity="0.16" strokeWidth="16" filter="url(#curl-blur)" />
      </g>
      {/* 접혀 올라온 뒷면 */}
      <path d={CURL_FLAP} fill="url(#curl-back)" />
      {/* 안쪽 윤곽선 */}
      <path d={CURL_EDGE} fill="none" stroke="#000000" strokeOpacity="0.15" strokeWidth="1.2" />
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
              className="absolute bottom-8 left-6 text-xs text-zinc-500 sm:left-auto"
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
