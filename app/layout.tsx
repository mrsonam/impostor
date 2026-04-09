import "./globals.css";
import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import { DeferredAppToastProvider } from "@/components/DeferredAppToastProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });

export const metadata: Metadata = {
  title: "Impostor",
  description: "Party game in your browser",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lexend.variable} font-sans`}
      suppressHydrationWarning
    >
      <body
        className="min-h-dvh bg-[#640d14] antialiased text-white selection:bg-orange-500/30 overflow-x-hidden relative"
        suppressHydrationWarning
      >
        {/* Desktop Background Decorations (Migrated from DeviceMockup) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-600/10 blur-[150px] rounded-full animate-float" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-900/20 blur-[180px] rounded-full animate-float" style={{ animationDelay: "-3s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-orange-500/[0.03] blur-[120px] rounded-full" />
          <div className="absolute inset-0 noise opacity-[0.03]" />
        </div>

        {/* Global Content Wrapper */}
        <div className="relative z-10 min-h-dvh flex flex-col">
          {children}
          <DeferredAppToastProvider />
        </div>
      </body>
    </html>
  );
}
