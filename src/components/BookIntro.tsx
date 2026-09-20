"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { BOOK_INTRO_KEY } from "@/lib/bookIntro";

// 홈 입장 인트로: 진한 표지가 오른쪽 아래 모서리부터 종이처럼 말려 넘어가며 이미 그려진 홈이 드러난다.
// - 세션당 1번만(sessionStorage), "동작 줄이기" 사용자는 생략
// - 표지를 HOLD_MS(3초) 동안 보여준 뒤 저절로 넘어감, 그 전에 클릭/아무 키를 누르면 바로 넘어감(Esc는 즉시 건너뜀)
// - 서버가 표지를 먼저 그려 두므로 첫 방문 때 홈이 깜빡이지 않고,
//   재방문은 layout의 스크립트가 html[data-intro-skip]로 미리 숨김

const HOLD_MS = 3000; // 표지를 보여준 뒤 저절로 넘어가기까지
const OPEN_SECONDS = 1.4; // 표지가 넘어가는 시간

const subscribe = () => () => {};
function getSeen(): boolean {
  try {
    return sessionStorage.getItem(BOOK_INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

// ── 모서리 넘김 기하 ──
// 접는 선은 오른쪽 아래 꼭짓점(BR)에서 왼쪽 위 꼭짓점(TL) 쪽으로 대각선 방향(u)을 따라 쓸고 간다.
// s(P)는 BR에서 u 방향으로 잰 거리. s < d 인 쪽이 넘겨진 부분(홈이 드러남),
// s ≥ d 인 쪽이 남은 표지이며, 넘겨진 부분은 접는 선을 기준으로 뒤집혀 표지 위에 얹힌다(뒷면).
type Pt = [number, number];

function clipHalfPlane(poly: Pt[], f: (p: Pt) => number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const fc = f(cur);
    const fp = f(prev);
    const cross = (): Pt => {
      const t = fp / (fp - fc);
      return [prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])];
    };
    if (fc >= 0) {
      if (fp < 0) out.push(cross());
      out.push(cur);
    } else if (fp >= 0) {
      out.push(cross());
    }
  }
  return out;
}

const toClipPath = (poly: Pt[]) =>
  poly.length < 3
    ? "polygon(0px 0px)"
    : `polygon(${poly.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",")})`;

function applyCurl(
  v: number,
  W: number,
  H: number,
  cover: HTMLElement,
  flap: HTMLElement,
  shade: HTMLElement,
) {
  const L = Math.hypot(W, H);
  const ux = -W / L;
  const uy = -H / L;
  const d = v * L;
  // CSS 그라디언트 각도(0deg=위쪽, 시계 방향). 이 각도에서는 0px 지점이 BR 꼭짓점이라 px 값이 곧 s 값이다.
  const angle = (Math.atan2(-W, H) * 180) / Math.PI;
  const s = ([x, y]: Pt) => ((W - x) * W + (H - y) * H) / L;
  const rect: Pt[] = [
    [0, 0],
    [W, 0],
    [W, H],
    [0, H],
  ];

  cover.style.clipPath = toClipPath(clipHalfPlane(rect, (p) => s(p) - d));

  const peeled = clipHalfPlane(rect, (p) => d - s(p));
  const flapPoly = peeled.map(([x, y]): Pt => {
    const k = 2 * (d - s([x, y]));
    return [x + k * ux, y + k * uy];
  });
  flap.style.visibility = "visible";
  flap.style.clipPath = toClipPath(flapPoly);
  flap.style.background = `linear-gradient(${angle}deg, #b8b8be ${d}px, #f4f4f6 ${d + d * 0.14}px, #ffffff ${d + d * 0.5}px, #e4e4e8 ${d + d}px)`;

  // 넘겨져 드러난 홈 위, 접는 선 가까이에 드리우는 그림자 (끝에서는 옅어짐)
  const spread = L * 0.1;
  shade.style.visibility = "visible";
  shade.style.clipPath = toClipPath(peeled);
  shade.style.background = `linear-gradient(${angle}deg, transparent ${d - spread}px, rgba(0,0,0,0.3) ${d}px)`;
  shade.style.opacity = String(Math.min(1, Math.max(0, (1 - v) / 0.2)));
}

export default function BookIntro() {
  const reduceMotion = useReducedMotion();
  // 서버 스냅샷은 항상 false → 서버 HTML에는 표지가 들어 있고, 클라이언트에서 실제 값으로 교정됨
  const seen = useSyncExternalStore(subscribe, getSeen, () => false);
  const [phase, setPhase] = useState<"cover" | "open" | "done">("cover");
  const active = !seen && !reduceMotion && phase !== "done";

  const rootRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);

  // 표지를 보여준 뒤 넘기기 시작
  useEffect(() => {
    if (!active || phase !== "cover") return;
    const timer = setTimeout(() => setPhase("open"), HOLD_MS);
    return () => clearTimeout(timer);
  }, [active, phase]);

  // 모서리 넘김 애니메이션 (매 프레임 clip-path를 직접 갱신)
  useEffect(() => {
    if (!active || phase !== "open") return;
    const root = rootRef.current;
    const cover = coverRef.current;
    const flap = flapRef.current;
    const shade = shadeRef.current;
    if (!root || !cover || !flap || !shade) {
      setPhase("done");
      return;
    }
    const W = root.clientWidth;
    const H = root.clientHeight;
    const controls = animate(0, 1, {
      duration: OPEN_SECONDS,
      ease: [0.55, 0, 0.35, 1],
      onUpdate: (v) => applyCurl(v, W, H, cover, flap, shade),
      onComplete: () => setPhase("done"),
    });
    return () => controls.stop();
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

  // 인트로 동안 스크롤 잠금 + 클릭/키 입력으로 바로 넘기기(Esc는 즉시 건너뛰기)
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
          ref={rootRef}
          data-book-intro
          aria-hidden="true"
          className="fixed inset-0 z-[100] cursor-pointer overflow-hidden"
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          {/* 넘겨져 드러난 홈 위에 드리우는 그림자 (넘김이 시작되면 나타남) */}
          <div ref={shadeRef} className="pointer-events-none invisible absolute inset-0" />

          {/* 표지 */}
          <div
            ref={coverRef}
            className="absolute inset-0 flex items-center justify-center bg-zinc-900"
          >
            {/* 책등 */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/60 to-transparent" />

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
              화면을 누르면 바로 넘어갑니다
            </motion.p>
          </div>

          {/* 넘겨진 표지의 뒷면(종이): 접는 선을 기준으로 뒤집혀 표지 위에 얹힌다 */}
          <div ref={flapRef} className="pointer-events-none invisible absolute inset-0" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
