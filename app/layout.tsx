import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/gl/SmoothScroll";

// The headline face. Its variable keeps a fixed name, so swapping the font
// only touches this file, never the stylesheet.
const display = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

const body = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Chunky Monkey · Fun For All",
    template: "%s · Chunky Monkey",
  },
  description:
    "Rides, food and big nights out for the whole family. Chunky Monkey amusement parks, open daily from 4 PM till midnight.",
};

export const viewport: Viewport = {
  themeColor: "#0b0920",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="min-h-full">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
