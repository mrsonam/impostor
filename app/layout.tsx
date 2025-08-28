import "./globals.css";
import type { Metadata } from "next";

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
    <html lang="en">
      <body className="min-h-dvh bg-[#640d14]">
        <div className="mx-auto max-w-md p-4 sm:p-6">
          
          {children}
        </div>
      </body>
    </html>
  );
}
