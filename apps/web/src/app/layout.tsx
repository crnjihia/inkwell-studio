import React from "react";
import type { Metadata } from "next";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Inkwell Studio - AI Content Platform for East African Creators",
    template: "%s | Inkwell Studio",
  },
  description:
    "Minimalistic production-grade AI content studio with TipTap collaborative editing, prompt version control, TimescaleDB dual-currency usage tracking (KES/USD), and edge caching.",
  keywords: [
    "Inkwell Studio",
    "Nairobi",
    "Kenya",
    "East Africa",
    "AI Content",
    "Swahili",
    "TipTap",
    "Yjs",
    "Collaboration",
  ],
  authors: [{ name: "Chris Odhiambo", url: "https://inkwell.africa" }],
  creator: "Chris Odhiambo",
  openGraph: {
    type: "website",
    locale: "sw_KE",
    alternateLocale: ["en_KE"],
    url: "https://inkwell.africa",
    title: "Inkwell Studio - AI Content Platform for East African Creators",
    description:
      "Minimalistic production-grade AI content studio with TipTap collaborative editing, prompt version control, TimescaleDB dual-currency usage tracking (KES/USD), and edge caching.",
    siteName: "Inkwell Studio",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sw" className="h-full dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  if (storedTheme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }

                try {
                  const storedLang = localStorage.getItem('inkwell_language');
                  if (storedLang === 'en' || storedLang === 'sw') {
                    document.documentElement.lang = storedLang;
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased text-zinc-900 bg-zinc-50 dark:text-zinc-100 dark:bg-zinc-950 transition-colors duration-150">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
