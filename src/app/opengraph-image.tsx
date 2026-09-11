import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#18181b",
          color: "#fafafa",
        }}
      >
        <div style={{ fontSize: 28, color: "#a1a1aa", display: "flex" }}>
          안녕하세요,
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 12, display: "flex" }}>
          김재원입니다
        </div>
        <div style={{ fontSize: 28, color: "#a1a1aa", marginTop: 20, display: "flex" }}>
          개인 소개 포트폴리오
        </div>
      </div>
    ),
    { ...size }
  );
}
