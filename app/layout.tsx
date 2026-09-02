import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UnityIntelCRM",
  description: "Lead un komisijas pārvaldība Facebook Ads kampaņām",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lv">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
