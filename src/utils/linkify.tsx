import React from "react";

// URL을 캡처 그룹으로 split → 텍스트 부분은 React가 자동 이스케이프, XSS 없음
const URL_SPLIT_RE = /(https?:\/\/[^\s<>"{}|\\^[\]`]+)/;

// URL 끝에 붙는 문장 부호(마침표·괄호 등)는 링크에서 제외
function trimTrailingPunct(url: string): [string, string] {
  const m = url.match(/[.,;:!?)\]]+$/);
  if (!m) return [url, ""];
  return [url.slice(0, url.length - m[0].length), m[0]];
}

export function linkify(text: string): React.ReactNode[] {
  const parts = text.split(URL_SPLIT_RE);
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (/^https?:\/\//.test(part)) {
      const [href, punct] = trimTrailingPunct(part);
      nodes.push(
        <React.Fragment key={i}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-blue-600 underline underline-offset-2 hover:text-blue-800"
          >
            {href}
          </a>
          {punct}
        </React.Fragment>,
      );
    } else {
      nodes.push(part);
    }
  }

  return nodes;
}
