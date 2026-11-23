"use client";

import { loadConsentManager, openCookiePreferences } from "./preferences";

export default function CookiesButton({
  className,
  children = "Cookies",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={openCookiePreferences}
      onPointerEnter={loadConsentManager}
      onFocus={loadConsentManager}
    >
      {children}
    </button>
  );
}
