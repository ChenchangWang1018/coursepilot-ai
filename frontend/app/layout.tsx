import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoursePilot AI",
  description: "Turn course PDFs into summaries, quizzes, and personalized study plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
