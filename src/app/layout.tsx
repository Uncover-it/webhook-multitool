import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Grid } from "@/components/ui/grid";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://webhook.uncoverit.org"),
  alternates: { canonical: "/" },
  title: {
    default: "Discord Webhook Multi-Tool",
    template: "Discord Webhook Multi-Tool",
  },
  description:
    "Take control of Discord webhooks online. Text-to-speech, spam messages, view webhook details, and delete unwanted webhooks easily with our multitool.",
  keywords: [
    "discord",
    "webhook",
    "multitool",
    "delete",
    "send",
    "spam",
    "info",
    "webhook spam",
    "webhook deleter",
    "discord webhooks",
    "discord webhook spammer",
    "discord webhook deleter",
    "discord multitool",
    "uncover it webhook",
    "uncover it webhook spammer",
    "uncover it spammer",
    "webhook uncover it",
    "webhook uncoverit",
    "uncoverit webhook",
    "uncoverit",
    "uncover it",
    "disco with me",
    "disco w me",
    "discord spam",
    "uncover it webhook spammer",
    "discord webhook",
    "online",
    "customize",
    "webhook spammer",
    "webhook spammer online",
    "disco with me discord",
    "disco with me webhook",
    "disco with me uncover it",
    "webhook tools",
    "online webhook tool",
    "webhook",
  ],
  openGraph: {
    title: "Discord Webhook Multi-Tool",
    description:
      "Take control of Discord webhooks online. Text-to-speech, spam messages, view webhook details, and delete unwanted webhooks easily with our multitool.",
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
    description:
      "Take control of Discord webhooks online. Text-to-speech, spam messages, view webhook details, and delete unwanted webhooks easily with our multitool.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" disableTransitionOnChange enableSystem>
          <div
            style={{ position: "fixed", inset: 0, zIndex: -1 }}
            aria-hidden="true"
          >
            <Grid />
          </div>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-T1PPWT7NT4" />
      <Script src="https://api.instatus.com/widget?host=status.uncoverit.org&code=4f0eef87&locale=en" />
    </html>
  );
}
