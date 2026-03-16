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
      <body className="min-h-screen bg-zinc-50 antialiased">{children}</body>
    </html>
  );
}
