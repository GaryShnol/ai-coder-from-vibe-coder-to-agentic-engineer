import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";
import BootSequence from "@/components/BootSequence";
import CommandPalette from "@/components/CommandPalette";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Gary Gavriel Shnol — Senior Backend & AI Engineer",
  description:
    "Senior backend engineer with 5+ years at enterprise scale. Java, Kafka, PostgreSQL, Generative AI. M.Sc. Software Engineering.",
  robots: "index, follow",
  openGraph: {
    title: "Gary Gavriel Shnol — Senior Backend & AI Engineer",
    description:
      "5+ years at enterprise scale. Java, Kafka, Generative AI. M.Sc. Software Engineering.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans noise">
        <CustomCursor />
        <BootSequence />
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}
