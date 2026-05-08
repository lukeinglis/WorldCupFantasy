import type { Metadata } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "World Cup 2026 Fantasy",
    template: "%s | World Cup 2026 Fantasy",
  },
  description:
    "Pick your winners for the FIFA World Cup 2026 in USA, Mexico, and Canada. Compete with friends in the ultimate World Cup fantasy contest.",
  metadataBase: new URL("https://soccer.lukeinglis.me"),
  openGraph: {
    title: "World Cup 2026 Fantasy",
    description:
      "Pick your winners for the FIFA World Cup 2026. Compete with friends in the ultimate fantasy contest.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${oswald.variable} ${sourceSans.variable} min-h-screen flex flex-col antialiased`}
      >
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
