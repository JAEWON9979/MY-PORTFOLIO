"use client";

import { useEffect, useState } from "react";

// 페이지 이동 시 본문(<main>)이 책등 쪽에서 살짝 돌아 들어오는 효과(globals.css의 .page-turn).
// template은 이동할 때마다 새로 만들어지므로, 모듈 변수로 "첫 진입(하드 로드)인지"를 구분한다:
// 첫 진입은 효과 없이 바로 보여주고(홈은 책 표지 인트로가 담당), 메뉴로 이동할 때만 재생한다.
// display: contents 라서 레이아웃(flex)에는 영향을 주지 않는다.
let hasNavigated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const [animate] = useState(() => hasNavigated);

  useEffect(() => {
    hasNavigated = true;
  }, []);

  return <div className={animate ? "page-turn contents" : "contents"}>{children}</div>;
}
