import type { Metadata } from "next";
import { PageIntro } from "@/components/kit";
import { type PolicyDetails, PrivacyPolicy } from "@/components/privacy-policy";

export const metadata: Metadata = {
  title: { absolute: "Privacy - Discord Webhook Multi-Tool" },
  description: "How the Discord Webhook Multi-Tool handles your data.",
  alternates: { canonical: "/privacy" },
};

const details: PolicyDetails = {
  tool: "Discord Webhook Multitool",
  service: "Discord",
  apiHost: "discord.com",
  servicePrivacyUrl: "https://discord.com/privacy",
  host: {
    name: "GitHub Pages",
    company: "GitHub, Inc.",
    privacyUrl:
      "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement",
  },
  stored: [
    {
      key: "savedWebhooks",
      what: "webhooks you saved, with the names you gave them and their URLs.",
    },
    {
      key: "webhookHistory",
      what: "the last 50 messages you sent, with the webhook URL and message ID, so they can be edited or deleted later.",
    },
    {
      key: "webhookTemplates",
      what: "message templates you saved. They never include a webhook URL.",
    },
  ],
  extra: [
    "Files you attach are uploaded straight to Discord.",
    "The preview shows avatar, thumbnail and image URLs you type by loading them, so the sites hosting those images see your IP address.",
  ],
};

export default function PrivacyPage() {
  return (
    <div className="relative mx-auto max-w-5xl px-6 pb-16 xl:px-1">
      <PageIntro
        title="Privacy"
        info="How the Webhook Multitool handles your data."
        github="https://github.com/Uncover-it/webhook-multitool"
        back={{ href: "/", label: "Webhook tool" }}
      />
      <PrivacyPolicy details={details} />
    </div>
  );
}
