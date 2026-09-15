import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Every Conversation Goes Through the Kubernetes API",
  description: "Explore how Kubernetes components coordinate through shared API state.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
