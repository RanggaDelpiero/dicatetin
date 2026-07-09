import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pundi — Pencatat Keuangan",
  description: "Aplikasi pencatat keuangan pribadi yang fun & digamify. Nyatet duit rasanya kayak main, bukan kerjaan.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pundi",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F7FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0D" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <head>
        {/* iOS PWA splash screens & meta */}
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pundi" />
      </head>
      <body className="min-h-full bg-bg-primary text-text-primary antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
