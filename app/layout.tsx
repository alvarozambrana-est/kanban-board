import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "A simple kanban board application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
