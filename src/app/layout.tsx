import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ConsentTheme } from "c15t/next";
import { ConsentManager } from "@/components/consent-manager";
import { theme as consentTheme } from "@/components/consent-manager/theme";
import { Backdrop } from "@/components/site/backdrop";

export const metadata: Metadata = {
  metadataBase: new URL("https://webhook.uncoverit.org"),
  alternates: { canonical: "/" },
  title: {
    default: "Discord Webhook Multi-Tool",
    template: "Discord Webhook Multi-Tool",
  },
  description: "Discord webhook personalizer, message sender and deleter.",
  keywords: [
    "discord",
    "webhook",
    "webhook deleter",
    "webhook spammer",
    "webhook multitool",
    "uncoverit",
    "uncover it",
  ],
  openGraph: {
    title: "Discord Webhook Multi-Tool",
    description: "Discord webhook personalizer, message sender and deleter.",
    url: "https://webhook.uncoverit.org",
    siteName: "Discord Webhook Multi-Tool",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  twitter: {
    title: "Discord Webhook Multi-Tool",
    card: "summary_large_image",
    description: "Discord webhook personalizer, message sender and deleter.",
  },
};

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <ConsentTheme theme={consentTheme} />
      </head>
      <body>
        <ThemeProvider attribute="class" disableTransitionOnChange enableSystem>
          <main className="relative flow-root min-h-svh overflow-clip">
            <Backdrop />
            {children}
          </main>
          <Toaster position="top-right" />
          <ConsentManager />
        </ThemeProvider>
        <Script
          src="https://api.instatus.com/widget?host=status.uncoverit.org&code=4f0eef87&locale=en"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
