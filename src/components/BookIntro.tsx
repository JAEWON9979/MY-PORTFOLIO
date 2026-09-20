"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BOOK_INTRO_KEY } from "@/lib/bookIntro";

// 홈 입장 인트로: 진한 표지가 화면 전체를 덮고, 오른쪽 가장자리에만 겹겹이 쌓인 종이 단면이 보인다.
// 클릭하면 표지가 왼쪽 책등을 축으로 넘어가고, 그 아래 종이들이 연달아 넘어가며 홈이 드러난다.
// - 클릭(또는 아무 키)로 열림, 아무것도 안 하면 AUTO_OPEN_MS 뒤 저절로 열림 → 방문자가 갇히지 않음
// - 세션당 1번만(sessionStorage), "동작 줄이기" 사용자는 생략, Esc로 즉시 건너뜀
// - 서버가 표지를 먼저 그려 두므로 첫 방문 때 홈이 깜빡이지 않고,
//   재방문은 layout의 스크립트가 html[data-intro-skip]로 미리 숨김

const AUTO_OPEN_MS = 6000; // 클릭이 없을 때 저절로 열리기까지
const COVER_SECONDS = 0.9; // 표지가 넘어가는 시간
const SHEET_SECONDS = 0.8; // 종이 한 장이 넘어가는 시간
const SHEET_STAGGER = 0.07; // 종이가 연달아 넘어가는 간격
const SHEET_COUNT = 4; // 오른쪽 가장자리에 보이는 종이 수
const OPEN_MS = 1150; // 열림이 끝나 인트로를 치우는 시점

type Phase = "idle" | "opening" | "done";

const subscribe = () => () => {};
function getSeen(): boolean {
  try {
    return sessionStorage.getItem(BOOK_INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

const OPEN_EASE: [number, number, number, number] = [0.7, 0, 0.2, 1];

export default function BookIntro() {
  const reduceMotion = useReducedMotion();
  // 서버 스냅샷은 항상 false → 서버 HTML에는 표지가 들어 있고, 클라이언트에서 실제 값으로 교정됨
  const seen = useSyncExternalStore(subscribe, getSeen, () => false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [hover, setHover] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const active = !seen && !reduceMotion && phase !== "done";

  const open = useCallback(() => {
    setPhase((p) => (p === "idle" ? "opening" : p));
  }, []);

  // 클릭이 없으면 저절로 열림
  useEffect(() => {
    if (!active || phase !== "idle") return;
    const timer = setTimeout(open, AUTO_OPEN_MS);
    return () => clearTimeout(timer);
  }, [active, phase, open]);

  // 열림이 끝나면 인트로 제거
  useEffect(() => {
    if (phase !== "opening") return;
    const timer = setTimeout(() => setPhase("done"), OPEN_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // 인트로가 끝나면 본 것으로 기록
  useEffect(() => {
    if (phase !== "done") return;
    try {
      sessionStorage.setItem(BOOK_INTRO_KEY, "1");
    } catch {
      /* 저장 실패해도 인트로만 다시 보일 뿐 */
    }
  }, [phase]);

  // 인트로 동안: 스크롤 잠금, 키보드 초점을 표지 버튼에 고정, 키 입력으로 열기(Esc는 건너뛰기)
  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    buttonRef.current?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault(); // 뒤의 홈으로 초점이 새지 않게
        buttonRef.current?.focus({ preventScroll: true });
        return;
      }
      if (e.key === "Escape") {
        setPhase("done");
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return; // 새로고침 같은 단축키는 그대로
      open();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, open]);

  const opening = phase === "opening";

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="book-intro"
          data-book-intro
          className="fixed inset-0 z-[100] overflow-hidden"
          style={
            {
              // 원근감이 화면 너비에 비례해야 넓은 화면에서도 서서히 열려 보임
              perspective: "max(2200px, 350vw)",
              // 오른쪽에 보이는 종이 단면 띠의 너비
              "--edge": "clamp(10px, 1.6vw, 24px)",
            } as CSSProperties
          }
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          {/* 화면 전체가 하나의 버튼 (키보드·스크린리더용) */}
          <button
            ref={buttonRef}
            type="button"
            aria-label="포트폴리오 열기"
            onClick={open}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => setHover(false)}
            className="absolute inset-0 z-30 cursor-pointer focus:outline-none"
          />

          {/* 표지·종이가 넘어가며 드러나는 홈 위에 드리우는 그림자 (열리는 동안 옅어짐) */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/8 to-transparent"
            initial={{ opacity: 1 }}
            animate={{ opacity: opening ? 0 : 1 }}
            transition={{ duration: COVER_SECONDS, ease: "easeOut" }}
          />

          {/* 종이 단면: 표지 오른쪽 끝 바깥으로 겹겹이 보이는 종이들. 열리면 표지 뒤를 이어 연달아 넘어감 */}
          {Array.from({ length: SHEET_COUNT }, (_, i) => SHEET_COUNT - 1 - i).map((i) => (
            <motion.div
              key={i}
              aria-hidden
              className="absolute left-0 top-0 h-full bg-white"
              style={{
                // i가 작을수록 표지에 가까운(위쪽) 종이 → 오른쪽 끝이 표지에 가깝다
                width: `calc(100% - var(--edge) * ${1 - (i + 1) / SHEET_COUNT})`,
                transformOrigin: "left center",
                borderRight: "1px solid #d4d4d8",
                backgroundImage:
                  "linear-gradient(to right, rgba(0,0,0,0.06), rgba(0,0,0,0) 6%)",
                boxShadow: "6px 0 18px rgba(0,0,0,0.10)",
              }}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: opening ? -180 : 0 }}
              transition={{
                duration: SHEET_SECONDS,
                delay: opening ? 0.06 + i * SHEET_STAGGER : 0,
                ease: OPEN_EASE,
              }}
            />
          ))}

          {/* 표지: 화면 전체(오른쪽 띠만 제외)를 덮고, 왼쪽 책등을 축으로 넘어감 */}
          <motion.div
            className="absolute left-0 top-0 h-full"
            style={{
              width: "calc(100% - var(--edge))",
              transformOrigin: "left center",
              transformStyle: "preserve-3d",
              boxShadow: "6px 0 14px rgba(0,0,0,0.28)",
            }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: opening ? -180 : hover ? -3.5 : 0 }}
            transition={{
              duration: opening ? COVER_SECONDS : 0.35,
              ease: opening ? OPEN_EASE : "easeOut",
            }}
          >
            {/* 바깥면 */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-zinc-900"
              style={{ backfaceVisibility: "hidden" }}
            >
              {/* 책등 */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/60 to-transparent" />
              {/* 표지 안쪽 테두리 */}
              <div className="pointer-events-none absolute inset-6 rounded-3xl border border-white/10 sm:inset-10" />

              <div className="text-center">
                <p className="text-xs font-medium tracking-[0.3em] text-zinc-500">
                  JAEWON&apos;S PORTFOLIO
                </p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  김재원
                </p>
                <div className="mx-auto mt-6 h-px w-12 bg-white/30" />
              </div>

              <motion.p
                aria-hidden
                className="absolute bottom-10 text-xs text-zinc-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: opening ? 0 : [0.3, 0.9, 0.3] }}
                transition={
                  opening
                    ? { duration: 0.2 }
                    : { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }
                }
              >
                클릭해서 열기
              </motion.p>
            </div>
            {/* 안쪽면 */}
            <div
              className="absolute inset-0 bg-zinc-100"
              style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
