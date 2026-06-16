import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveAssist AI | Real-time knowledge assistance",
  description:
    "A private desktop overlay that gives customer-facing teams instant answers from company documents during live conversations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
