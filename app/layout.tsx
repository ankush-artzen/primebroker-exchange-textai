import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { PWARegister } from "@/components/PWARegister";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prime Brokers",
  description: "Real-estate broker CRM — leads, properties & follow-ups",
  manifest: "/manifest.json?v=3",
  icons: {
    icon: [
      { url: "/icons/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=3", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png?v=3",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prime Brokers",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1c2230",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
