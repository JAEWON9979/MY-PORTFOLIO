"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BOOK_INTRO_KEY } from "@/lib/bookIntro";

// 홈 입장 인트로: 책 한 권이 놓여 있다가 클릭하면 표지가 착 넘어가며 첫 페이지가 화면을 채우고 홈으로 이어진다.
// - 클릭(또는 아무 키)로 열림, 아무것도 안 하면 AUTO_OPEN_MS 뒤 저절로 열림 → 방문자가 갇히지 않음
// - 세션당 1번만(sessionStorage), "동작 줄이기" 사용자는 생략, Esc로 즉시 건너뜀
// - 서버가 책을 먼저 그려 두므로 첫 방문 때 홈이 깜빡이지 않고,
//   재방문은 layout의 스크립트가 html[data-intro-skip]로 미리 숨김

const AUTO_OPEN_MS = 6000; // 클릭이 없을 때 저절로 열리기까지
const OPEN_SECONDS = 0.9; // 표지가 넘어가는 시간
const ENTER_SECONDS = 0.75; // 첫 페이지가 화면을 채우는 시간
const THICKNESS = 28; // 책 두께(px)
const HALF = THICKNESS / 2;

type Phase = "idle" | "opening" | "entering" | "done";

const subscribe = () => () => {};
function getSeen(): boolean {
  try {
    return sessionStorage.getItem(BOOK_INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

// 옆면 종이 단면 무늬
const PAGE_EDGE_X =
  "repeating-linear-gradient(to right, #ffffff 0, #ffffff 2px, #d4d4d8 2px, #d4d4d8 3px)";
const PAGE_EDGE_Y =
  "repeating-linear-gradient(to bottom, #ffffff 0, #ffffff 2px, #d4d4d8 2px, #d4d4d8 3px)";

export default function BookIntro() {
  const reduceMotion = useReducedMotion();
  // 서버 스냅샷은 항상 false → 서버 HTML에는 책이 들어 있고, 클라이언트에서 실제 값으로 교정됨
  const seen = useSyncExternalStore(subscribe, getSeen, () => false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [hover, setHover] = useState(false);
  // 열리는 순간 책 크기를 재서 정한다: 펼친 책을 가운데로 옮기는 거리, 첫 페이지가 화면을 덮는 배율
  const [geo, setGeo] = useState({ shift: 150, scale: 7 });
  const bookRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const active = !seen && !reduceMotion && phase !== "done";

  const open = useCallback(() => {
    const el = bookRef.current;
    if (el) {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      // 펼친 책(표지 안쪽 + 첫 페이지)이 화면에 다 들어가면 책 전체를 가운데로,
      // 좁은 화면이면 옮기지 않아 첫 페이지가 가운데에 오게 한다(표지는 왼쪽으로 반쯤 잘림)
      const spreadFits = window.innerWidth >= w * 2 + 32;
      setGeo({
        shift: spreadFits ? w / 2 : 0,
        scale: Math.max(window.innerWidth / w, window.innerHeight / h) * 1.15,
      });
    }
    setPhase((p) => (p === "idle" ? "opening" : p));
  }, []);

  // 클릭이 없으면 저절로 열림
  useEffect(() => {
    if (!active || phase !== "idle") return;
    const timer = setTimeout(open, AUTO_OPEN_MS);
    return () => clearTimeout(timer);
  }, [active, phase, open]);

  // 열림 → 입장 → 완료
  useEffect(() => {
    if (phase === "opening") {
      const timer = setTimeout(() => setPhase("entering"), OPEN_SECONDS * 1000 + 50);
      return () => clearTimeout(timer);
    }
    if (phase === "entering") {
      const timer = setTimeout(() => setPhase("done"), ENTER_SECONDS * 1000);
      return () => clearTimeout(timer);
    }
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

  // 인트로 동안: 스크롤 잠금, 키보드 초점을 책 버튼에 고정, 키 입력으로 열기(Esc는 건너뛰기)
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

  const isIdle = phase === "idle";
  const isEntering = phase === "entering";

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="book-intro"
          data-book-intro
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at center, #fafafa 0%, #e4e4e7 100%)",
          }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          {/* 화면 전체가 하나의 버튼 (키보드·스크린리더용) */}
          <button
            ref={buttonRef}
            type="button"
            aria-label="포트폴리오 열기"
            onClick={open}
            onPointerMove={(e) => {
              // 화면 전체가 버튼이라, 책 위에 있을 때만 "표지가 살짝 들림" 반응을 준다
              const rect = bookRef.current?.getBoundingClientRect();
              if (!rect) return;
              const margin = 24;
              setHover(
                e.clientX >= rect.left - margin &&
                  e.clientX <= rect.right + margin &&
                  e.clientY >= rect.top - margin &&
                  e.clientY <= rect.bottom + margin,
              );
            }}
            onPointerLeave={() => setHover(false)}
            className="absolute inset-0 z-10 cursor-pointer focus:outline-none"
          />

          {/* 펼친 책을 가운데로 옮기고(열림), 첫 페이지를 화면 가득 확대(입장) */}
          <motion.div
            className="relative"
            initial={{ x: 0, scale: 1 }}
            animate={
              isEntering
                ? { x: 0, scale: geo.scale }
                : phase === "opening"
                  ? { x: geo.shift, scale: 1 }
                  : { x: 0, scale: 1 }
            }
            transition={
              isEntering
                ? { duration: ENTER_SECONDS, ease: [0.7, 0, 0.3, 1] }
                : { duration: OPEN_SECONDS, ease: [0.65, 0, 0.35, 1] }
            }
          >
            {/* 바닥 그림자 */}
            <motion.div
              aria-hidden
              className="absolute left-1/2 top-full mt-8 h-6 w-[80%] -translate-x-1/2 rounded-[50%] bg-black/30 blur-xl"
              initial={{ opacity: 1 }}
              animate={{ opacity: isIdle ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            />

            {/* 살짝 떠 있는 듯한 움직임 */}
            <motion.div
              initial={{ y: 0 }}
              animate={isIdle ? { y: [0, -8, 0] } : { y: 0 }}
              transition={
                isIdle
                  ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.4 }
              }
            >
              <div
                ref={bookRef}
                className="relative"
                style={{
                  width: "min(62vw, 300px)",
                  aspectRatio: "3 / 4.2",
                  perspective: 1400,
                }}
              >
                {/* 기울어진 책 (열릴 때는 정면으로 펴짐) */}
                <motion.div
                  className="absolute inset-0"
                  style={{ transformStyle: "preserve-3d" }}
                  initial={{ rotateX: -8, rotateY: -24 }}
                  animate={
                    isIdle
                      ? { rotateX: -8, rotateY: hover ? -16 : -24 }
                      : { rotateX: 0, rotateY: 0 }
                  }
                  transition={{ duration: isIdle ? 0.4 : OPEN_SECONDS, ease: [0.65, 0, 0.35, 1] }}
                >
                  {/* 뒷표지 */}
                  <div
                    className="absolute inset-0 rounded-md bg-zinc-800"
                    style={{ transform: `translateZ(${-HALF}px)` }}
                  />

                  {/* 오른쪽 옆면(종이 단면) */}
                  <div
                    aria-hidden
                    className="absolute"
                    style={{
                      left: "100%",
                      top: 3,
                      bottom: 3,
                      width: THICKNESS,
                      transformOrigin: "left center",
                      transform: `translateZ(${HALF}px) rotateY(90deg)`,
                      background: PAGE_EDGE_X,
                    }}
                  />

                  {/* 윗면(종이 단면) */}
                  <div
                    aria-hidden
                    className="absolute"
                    style={{
                      left: 2,
                      right: 3,
                      top: -THICKNESS,
                      height: THICKNESS,
                      transformOrigin: "bottom center",
                      transform: `translateZ(${HALF}px) rotateX(90deg)`,
                      background: PAGE_EDGE_Y,
                    }}
                  />

                  {/* 첫 페이지 (표지가 넘어가면 드러남) */}
                  <div
                    className="absolute bg-white"
                    style={{
                      inset: "2px 2px 2px 0",
                      transform: `translateZ(${HALF - 5}px)`,
                      backgroundImage:
                        "linear-gradient(to right, rgba(0,0,0,0.10), rgba(0,0,0,0) 10%)",
                    }}
                  />

                  {/* 앞표지: 왼쪽 책등을 축으로 넘어감 */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      z: HALF,
                      transformOrigin: "left center",
                      transformStyle: "preserve-3d",
                    }}
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: isIdle ? (hover ? -9 : 0) : -178 }}
                    transition={{
                      duration: isIdle ? 0.35 : OPEN_SECONDS,
                      ease: isIdle ? "easeOut" : [0.7, 0, 0.2, 1],
                    }}
                  >
                    {/* 표지 바깥면 */}
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-md bg-zinc-900"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-3 rounded-l-md bg-gradient-to-r from-black/60 to-transparent" />
                      <div className="pointer-events-none absolute inset-4 rounded-lg border border-white/10" />
                      <div className="text-center">
                        <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-500">
                          JAEWON&apos;S PORTFOLIO
                        </p>
                        <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                          김재원
                        </p>
                        <div className="mx-auto mt-5 h-px w-10 bg-white/30" />
                      </div>
                    </div>
                    {/* 표지 안쪽면 */}
                    <div
                      className="absolute inset-0 rounded-md bg-zinc-100"
                      style={{
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                      }}
                    />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* 안내 문구 */}
          <motion.p
            aria-hidden
            className="pointer-events-none absolute bottom-12 text-sm text-zinc-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: isIdle ? [0.35, 1, 0.35] : 0 }}
            transition={
              isIdle
                ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
            }
          >
            클릭해서 열기
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
