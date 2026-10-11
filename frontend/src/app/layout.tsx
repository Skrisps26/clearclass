import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ClearClass · School Decision Engine",
  description: "Location-agnostic school air-quality decision support for staff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <template
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: School air decisions are a duty sheet, not a metric dashboard; one stance and one activity list.
OWN-WORLD: Cool off-white canvas, white reading surface, ink and quiet blue controls, ruled rows, restrained semantic status colors.
STORY: Staff check the day's stance, compare cohort activity directives, then inspect evidence or prepare classroom and parent actions.
FIRST VIEWPORT: Compact masthead and underlined navigation above a full-width decision statement; at least two activity rows visible on a 390px phone.
FORM: Staff-room risk-assessment sheet, grounded candidate 3, seed 028d3f84.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
