import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartSync from "@/components/cart/CartSync";

export const metadata: Metadata = {
  title: { default: "아두몰 - 아두이노 & 전자부품 쇼핑몰", template: "%s | 아두몰" },
  description: "아두이노 보드, 센서, 모듈, 모터, 전자부품을 한 곳에서.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <CartSync />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
