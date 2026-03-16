import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JukeShelf",
  description: "Prosty jukebox z live głosowaniem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-[#130a28] text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
