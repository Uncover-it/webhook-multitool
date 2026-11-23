"use client";

import { useEffect } from "react";
import {
  ConsentBanner,
  ConsentDialog,
  ConsentProvider,
  type ConsentProviderOptions,
  useModel,
  useSetActiveUI,
} from "c15t/next";
import { local } from "c15t/react";
import { gtag } from "@c15t/integrations/google-tag";
import { registerPreferencesOpener } from "./preferences";
import { theme } from "./theme";

// Read once when the provider mounts, so built once here. The Google tag is
// only requested once someone accepts measurement: before that the page makes
// no request to Google at all, cookieless or not
const options = {
  mode: local({ acknowledgeNoRecords: true }),
  theme,
  scripts: [
    gtag({
      id: "G-T1PPWT7NT4",
      category: "measurement",
      loadMode: "after-consent",
    }),
  ],
  // Says exactly what is asked for: the stock text mentions personalised
  // content, which this tool doesn't have
  i18n: {
    messages: {
      en: {
        cookieBanner: {
          title: "Analytics cookies",
          description:
            "We'd like to use Google Analytics to learn how this tool is used. It only loads if you accept, and it never sees what you send.",
        },
      },
    },
  },
  legalLinks: {
    privacyPolicy: { href: "/privacy", target: "_self" },
    termsOfService: { href: "https://www.uncoverit.org/terms" },
  },
} satisfies ConsentProviderOptions;

const LEGAL_LINKS: ("privacyPolicy" | "termsOfService")[] = [
  "privacyPolicy",
  "termsOfService",
];

// The privacy page's cookie settings button lives outside c15t, so it
// reaches the dialog through this, once the policy is resolved and the dialog
// has something to show
function PreferencesOpener() {
  const model = useModel();
  const setActiveUI = useSetActiveUI();

  useEffect(() => {
    if (model === null) return;
    return registerPreferencesOpener(() => setActiveUI("dialog"));
  }, [model, setActiveUI]);

  return null;
}

/**
 * c15t's provider with its stock banner and preference dialog, themed to the
 * site. Loaded lazily by ConsentManager, and wraps nothing: no other part of
 * the site reads consent.
 * @see https://c15t.com/docs/frameworks/nextjs/quickstart
 */
export default function ConsentManagerProvider() {
  return (
    <ConsentProvider options={options}>
      {/* c15t only shows the legal links a component names, despite its docs */}
      <ConsentBanner legalLinks={LEGAL_LINKS} />
      <ConsentDialog legalLinks={LEGAL_LINKS} />
      <PreferencesOpener />
    </ConsentProvider>
  );
}
