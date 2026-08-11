import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const imageUrl = new URL("/og.png", origin).toString();

  return {
    metadataBase: new URL(origin),
    title: "마태피아 — 마태도 비공식 기록 보관소",
    description: "2011년부터 이어지는 마태도 아이들의 위키, 기록장, 채팅 보관소.",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: "마태피아",
      description: "MATAEDO PRIVATE ARCHIVE / EST. 2011",
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "마태피아 기록 보관소" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "마태피아",
      description: "MATAEDO PRIVATE ARCHIVE / EST. 2011",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
