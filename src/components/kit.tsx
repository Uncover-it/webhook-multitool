"use client";

import { MoonStar, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const pill = cn(
  badgeVariants({ variant: "outline" }),
  "h-8 cursor-pointer gap-1.5 px-2.5 font-mono text-sm tracking-tight transition-colors hover:bg-accent [&>svg]:size-3.5",
);

/** Buttons sit in the same monospace, slightly rounder style. */
export const mono = "rounded-lg font-mono tracking-tight";

function ThemePill() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      className={cn(pill, "w-8 px-0")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="block dark:hidden" />
      <MoonStar className="hidden dark:block" />
    </button>
  );
}

export function PageIntro({
  title,
  info,
  github,
  back,
}: {
  title: string;
  info: ReactNode;
  github: string;
  back?: { href: string; label: string };
}) {
  return (
    <>
      <h1 className="mt-8 max-w-2xl text-5xl text-balance md:text-6xl lg:mt-16">
        {title}
      </h1>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="min-w-0 text-lg sm:truncate">{info}</p>
        <div className="flex flex-wrap items-center gap-2">
          <a href={github} target="_blank" rel="noreferrer" className={pill}>
            GitHub
          </a>
          <a
            href="https://discord.com/servers/uncover-it-1298592315694387220"
            target="_blank"
            rel="noreferrer"
            className={pill}
          >
            Discord
          </a>
          <Link href={back?.href ?? "/privacy"} className={pill}>
            {back?.label ?? "Privacy"}
          </Link>
          <ThemePill />
        </div>
      </div>
    </>
  );
}

export function ToolTabs<T extends string>({
  value,
  onChange,
  tabs,
  disabled,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  tabs: { value: T; label: string; count?: number }[];
  disabled?: (value: T) => boolean;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "grid w-full grid-cols-[repeat(auto-fit,minmax(3.5rem,1fr))] gap-1 rounded-xl border border-border/40 bg-accent p-1 dark:bg-muted/40",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled?.(tab.value)}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-0.5 py-1.5 font-mono text-xs tracking-tight whitespace-nowrap disabled:pointer-events-none disabled:opacity-40 sm:px-3 sm:text-sm",
              active
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "hidden text-xs sm:inline",
                  active ? "text-background/70" : "text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative mt-8 rounded-2xl border bg-background p-2 px-3 shadow-lg ring-1 ring-background",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </section>
  );
}

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "my-2 rounded-xl border border-border/40 bg-accent p-4 text-sm dark:bg-muted/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  aside,
  hint,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  aside?: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="font-medium">
          {label}
        </label>
        {aside && (
          <span className="font-mono text-xs text-muted-foreground">
            {aside}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Actions({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 pt-1 pb-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TriggerLabel({
  title,
  count,
  note,
}: {
  title: string;
  count?: number;
  note?: ReactNode;
}) {
  return (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
      {title}
      {count !== undefined && count > 0 && (
        <span className="font-mono text-sm font-normal text-muted-foreground">
          {count}
        </span>
      )}
      {note && (
        <span className="text-xs font-normal text-muted-foreground">
          {note}
        </span>
      )}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
