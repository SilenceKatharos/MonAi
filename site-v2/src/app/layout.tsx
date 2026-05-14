import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { ParticleField } from "@/components/motion/ParticleField";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import SmoothScroll from "@/components/providers/SmoothScroll";
import "./globals.css";

// Variable axes — no `weight` parameter so the full variable font is loaded
// and made available under the CSS variables wired into globals.css @theme.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MonAI",
  description:
    "Native L1 cryptocurrency, identity and reputation protocol for autonomous AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SmoothScroll>
          <ParticleField />
          <Header />
          <ScrollProgress />
          <main className="flex-1">{children}</main>
          <Footer />
          <CustomCursor />
        </SmoothScroll>
      </body>
    </html>
  );
}
