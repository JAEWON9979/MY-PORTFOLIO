// 홈 입장 인트로(책 표지 열림)를 세션당 한 번만 보여주기 위한 공용 상수·스크립트.
export const BOOK_INTRO_KEY = "book-intro-seen";

// 이미 본 세션이거나 OS에서 "동작 줄이기"를 켠 경우, 첫 페인트 전에 <html>에 표시를 달아
// CSS(`html[data-intro-skip] [data-book-intro]`)로 표지를 숨긴다. (서버가 표지를 미리 그려 두므로
// 이 스크립트가 없으면 재방문 때 표지가 잠깐 깜빡인다.)
export const BOOK_INTRO_SKIP_SCRIPT = `try{if(sessionStorage.getItem("${BOOK_INTRO_KEY}")==="1"||matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.setAttribute("data-intro-skip","")}}catch(e){}`;
