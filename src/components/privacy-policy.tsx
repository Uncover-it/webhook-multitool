import type { ReactNode } from "react";
import CookiesButton from "@/components/consent-manager/cookies-button";
import { Panel, pill, Section } from "@/components/kit";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const POLICY_UPDATED = { iso: "2026-11-23", label: "November 23, 2026" };

// Everything that differs between the two tools; the rest of the policy is shared
export interface PolicyDetails {
  tool: string;
  /** "Discord" or "Telegram" */
  service: string;
  /** The API the browser talks to directly */
  apiHost: string;
  servicePrivacyUrl: string;
  host: { name: string; company: string; privacyUrl: string };
  /** What the tool keeps in the browser's localStorage */
  stored: { key: string; what: string }[];
  /** Anything else the tool sends somewhere, tool by tool */
  extra: ReactNode[];
}

function Item({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="py-2 text-lg font-semibold">
        {title}
      </AccordionTrigger>
      <AccordionContent className="space-y-2 text-muted-foreground">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

const em = "text-foreground";

export function PrivacyPolicy({ details }: { details: PolicyDetails }) {
  const { tool, service, apiHost, servicePrivacyUrl, host, stored, extra } =
    details;

  return (
    <>
      <Section
        title="Cookie settings"
        description="Analytics only runs if you allow it, and you can change your mind at any time"
      >
        <Panel className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground">
            The only optional cookies are Google Analytics&apos;. Without your
            consent the page never contacts Google.
          </p>
          <CookiesButton className={pill}>Cookie settings</CookiesButton>
        </Panel>
      </Section>

      <Section
        title="Privacy policy"
        description={
          <>
            Last updated{" "}
            <time dateTime={POLICY_UPDATED.iso}>{POLICY_UPDATED.label}</time>
          </>
        }
      >
        <Panel>
          <p className="mb-2 text-muted-foreground">
            This explains what the {tool} at this address does with your data.
            It is run by UncoverIt OÜ (&quot;Uncover it&quot;, &quot;we&quot;),
            which is the data controller. Using the tool is also subject to the{" "}
            <a
              href="https://www.uncoverit.org/terms"
              className={`${em} underline underline-offset-2`}
            >
              Uncover it Terms of Use
            </a>
            .
          </p>
          <Accordion type="multiple" defaultValue={["short"]}>
            <Item value="short" title="1. The short version">
              <p>
                The tool runs entirely in your browser. Your {service}{" "}
                {service === "Discord" ? "webhook URLs" : "bot tokens"},
                messages and files go straight from your browser to {service}{" "}
                and never pass through a server of ours. What you save stays in
                your browser. Analytics only runs if you accept it in the cookie
                banner.
              </p>
            </Item>

            <Item value="service" title={`2. What goes to ${service}`}>
              <p>
                Everything you send, edit, delete or look up is a request from
                your browser to{" "}
                <span className={`${em} font-mono`}>{apiHost}</span>. {service}{" "}
                receives what you enter along with your IP address and browser
                details, as with any request to them. How they handle it is
                covered by{" "}
                <a
                  href={servicePrivacyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${em} underline underline-offset-2`}
                >
                  {service}&apos;s privacy policy
                </a>
                . We do not see or keep any of it.
              </p>
              {extra.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </Item>

            <Item value="stored" title="3. What stays in your browser">
              <p>
                These are kept in your browser&apos;s local storage, on your
                device only. We cannot read them. Clearing your browser&apos;s
                site data, or the clear buttons in the tool, removes them.
              </p>
              <ul className="space-y-1">
                {stored.map((entry) => (
                  <li key={entry.key}>
                    <span className={`${em} font-mono`}>{entry.key}</span>:{" "}
                    {entry.what}
                  </li>
                ))}
                <li>
                  <span className={`${em} font-mono`}>theme</span>: whether you
                  picked the light or dark theme.
                </li>
              </ul>
              <p>
                Anyone who can use this browser can read saved{" "}
                {service === "Discord" ? "webhook URLs" : "tokens"}. Don&apos;t
                save them on a shared computer.
              </p>
            </Item>

            <Item value="cookies" title="4. Cookies and analytics">
              <p>
                <span className={em}>Your consent choice</span> is stored in a
                first-party cookie named <span className="font-mono">c15t</span>{" "}
                (plus related c15t entries), so the banner doesn&apos;t ask
                again. It holds only your choice and is strictly necessary to
                respect it.
              </p>
              <p>
                <span className={em}>Google Analytics 4</span> (Google LLC) only
                loads after you accept measurement. It then sets the{" "}
                <span className="font-mono">_ga</span> and{" "}
                <span className="font-mono">_ga_*</span> cookies (up to two
                years) and records which pages you open, your browser and device
                type, an approximate location derived from your IP address, and
                how long you stay. It never receives your tokens, webhook URLs
                or messages. We use it to see how the tool is used and what to
                improve. Data is kept for at most 14 months. Google may process
                it in the United States under the EU-US Data Privacy Framework.{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className={`${em} underline underline-offset-2`}
                >
                  Google&apos;s privacy policy
                </a>
                .
              </p>
              <p>
                You can withdraw consent at any time with the Cookie settings
                button above. Doing so stops analytics from loading on your next
                visit.
              </p>
            </Item>

            <Item value="hosting" title="5. Hosting and the status widget">
              <p>
                <span className={em}>Hosting.</span> The site is served by{" "}
                {host.name} ({host.company}), which processes your IP address
                and request details to deliver the page and protect it from
                abuse.{" "}
                <a
                  href={host.privacyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${em} underline underline-offset-2`}
                >
                  Their privacy policy
                </a>
                .
              </p>
              <p>
                <span className={em}>Status widget.</span> A small widget from
                Instatus shows whether Uncover it is having an outage. Loading
                it sends your IP address and browser details to Instatus.
              </p>
              <p>
                Fonts are bundled with the site, so no font requests go to
                Google.
              </p>
            </Item>

            <Item value="basis" title="6. Legal basis">
              <p>
                Analytics: your consent (GDPR Art. 6(1)(a)). Hosting, security
                and remembering your consent choice: our legitimate interest in
                running a safe, working site (Art. 6(1)(f)). The tool itself
                processes nothing on our side.
              </p>
            </Item>

            <Item value="rights" title="7. Your rights">
              <p>
                You can ask us for access to, correction or deletion of personal
                data we hold about you, ask us to restrict or stop processing
                it, ask for a copy in a portable format, and withdraw consent at
                any time. Since the tool keeps your data in your own browser, in
                practice this mostly concerns analytics data, which Google holds
                on our behalf.
              </p>
              <p>
                You may also complain to a data protection authority. Ours is
                the Estonian Data Protection Inspectorate (Andmekaitse
                Inspektsioon, <span className="font-mono">aki.ee</span>).
              </p>
            </Item>

            <Item value="children" title="8. Children">
              <p>
                The tool is not meant for children under 16, and we don&apos;t
                knowingly collect their data.
              </p>
            </Item>

            <Item value="changes" title="9. Changes">
              <p>
                We will update this page when the tool changes what it does with
                data, and change the date at the top.
              </p>
            </Item>

            <Item value="contact" title="10. Contact">
              <p>
                UncoverIt OÜ, Juhkentali tn 8, Tallinn, 10132, Estonia. Registry
                code 17606284. Email{" "}
                <span className={`${em} font-mono`}>mel@uncoverit.org</span>.
              </p>
            </Item>
          </Accordion>
        </Panel>
      </Section>
    </>
  );
}
