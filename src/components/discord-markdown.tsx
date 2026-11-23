import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Renders Discord's markdown the way the client shows it, as React elements.
// Mentions, timestamps and custom emoji come out the way Discord draws them,
// and links look like links but are never clickable

type Inline =
  | string
  | { kind: "b" | "i" | "u" | "s" | "spoiler"; children: Inline[] }
  | { kind: "code"; text: string }
  | { kind: "link"; label: Inline[] }
  | { kind: "mention"; text: string }
  | { kind: "time"; text: string }
  | { kind: "emoji"; name: string };

const MARKS: [string, "b" | "i" | "u" | "s" | "spoiler"][] = [
  ["**", "b"],
  ["__", "u"],
  ["~~", "s"],
  ["||", "spoiler"],
  ["*", "i"],
  ["_", "i"],
];

const TIME_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  t: { hour: "numeric", minute: "2-digit" },
  T: { hour: "numeric", minute: "2-digit", second: "2-digit" },
  d: { day: "2-digit", month: "2-digit", year: "numeric" },
  D: { day: "numeric", month: "long", year: "numeric" },
  f: {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
  F: {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
};

function relativeTime(date: Date) {
  const seconds = (date.getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];
  const [unit, size] = units.find(([, s]) => Math.abs(seconds) >= s) ?? [
    "second",
    1,
  ];
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round(seconds / size),
    unit,
  );
}

export function formatTimestamp(unix: number, style = "f") {
  const date = new Date(unix * 1000);
  if (Number.isNaN(date.getTime())) return null;
  if (style === "R") return relativeTime(date);
  return new Intl.DateTimeFormat(
    "en-US",
    TIME_FORMATS[style] ?? TIME_FORMATS.f,
  ).format(date);
}

// Tokens that start with "<" or "@": mentions, timestamps, emoji, autolinks
const SPECIAL =
  /^(?:<@!?(\d+)>|<@&(\d+)>|<#(\d+)>|<t:(-?\d{1,13})(?::([tTdDfFR]))?>|<a?:(\w{2,32}):\d+>|@(everyone|here)\b|<(https?:\/\/[^\s>]+)>)/;

function parseInline(source: string): Inline[] {
  let i = 0;

  const parse = (closer?: string): Inline[] => {
    const out: Inline[] = [];
    let text = "";
    const flush = () => {
      if (text) out.push(text);
      text = "";
    };

    while (i < source.length) {
      if (closer && source.startsWith(closer, i)) {
        i += closer.length;
        flush();
        return out;
      }

      const char = source[i];
      if (char === "\\" && /[\\*_~|`<>[\]#-]/.test(source[i + 1] ?? "")) {
        text += source[i + 1];
        i += 2;
        continue;
      }

      if (char === "`") {
        const fence = source.startsWith("``", i) ? "``" : "`";
        const end = source.indexOf(fence, i + fence.length);
        if (end !== -1) {
          flush();
          out.push({
            kind: "code",
            text: source.slice(i + fence.length, end).trim() || " ",
          });
          i = end + fence.length;
          continue;
        }
      }

      if (char === "<" || char === "@") {
        const match = SPECIAL.exec(source.slice(i));
        if (match) {
          const [
            whole,
            user,
            role,
            channel,
            unix,
            style,
            emoji,
            everyone,
            url,
          ] = match;
          flush();
          if (user)
            out.push({ kind: "mention", text: `@user ${user.slice(-4)}` });
          else if (role)
            out.push({ kind: "mention", text: `@role ${role.slice(-4)}` });
          else if (channel)
            out.push({
              kind: "mention",
              text: `#channel ${channel.slice(-4)}`,
            });
          else if (unix)
            out.push({
              kind: "time",
              text: formatTimestamp(Number(unix), style) ?? whole,
            });
          else if (emoji) out.push({ kind: "emoji", name: emoji });
          else if (everyone)
            out.push({ kind: "mention", text: `@${everyone}` });
          else if (url) out.push({ kind: "link", label: [url] });
          i += whole.length;
          continue;
        }
      }

      if (char === "[") {
        const labelEnd = source.indexOf("](", i);
        const urlEnd = labelEnd === -1 ? -1 : source.indexOf(")", labelEnd + 2);
        if (
          labelEnd !== -1 &&
          urlEnd !== -1 &&
          /^<?https?:\/\/\S+?>?$/.test(source.slice(labelEnd + 2, urlEnd))
        ) {
          flush();
          const label = source.slice(i + 1, labelEnd);
          out.push({ kind: "link", label: parseInline(label) });
          i = urlEnd + 1;
          continue;
        }
      }

      if (source.startsWith("http://", i) || source.startsWith("https://", i)) {
        const match = /^https?:\/\/[^\s<]+[^\s<.,:;"')\]]/.exec(
          source.slice(i),
        );
        if (match) {
          flush();
          out.push({ kind: "link", label: [match[0]] });
          i += match[0].length;
          continue;
        }
      }

      const mark = MARKS.find(([token]) => source.startsWith(token, i));
      const close = mark ? source.indexOf(mark[0], i + mark[0].length) : -1;
      // An opening mark needs a closing one with something in between, and
      // "_" only counts at a word boundary, so snake_case names stay as they are
      if (
        mark &&
        close > i + mark[0].length &&
        !(mark[0] === "_" && /\w/.test(source[i - 1] ?? ""))
      ) {
        flush();
        i += mark[0].length;
        out.push({ kind: mark[1], children: parse(mark[0]) });
        continue;
      }

      text += char;
      i++;
    }

    flush();
    return out;
  };

  return parse();
}

function renderInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((node, index) => {
    if (typeof node === "string") return <span key={index}>{node}</span>;
    switch (node.kind) {
      case "b":
        return <strong key={index}>{renderInline(node.children)}</strong>;
      case "i":
        return <em key={index}>{renderInline(node.children)}</em>;
      case "u":
        return (
          <span key={index} className="underline">
            {renderInline(node.children)}
          </span>
        );
      case "s":
        return (
          <span key={index} className="line-through">
            {renderInline(node.children)}
          </span>
        );
      case "spoiler":
        return (
          <span
            key={index}
            title="Spoiler"
            className="rounded-sm bg-[#1e1f22] text-transparent transition-colors hover:bg-[#1e1f22]/40 hover:text-inherit"
          >
            {renderInline(node.children)}
          </span>
        );
      case "code":
        return (
          <code
            key={index}
            className="rounded-[3px] bg-[#1e1f22] px-1 py-px font-mono text-[0.85em]"
          >
            {node.text}
          </code>
        );
      case "link":
        return (
          <span key={index} className="text-[#00a8fc] hover:underline">
            {renderInline(node.label)}
          </span>
        );
      case "mention":
        return (
          <span
            key={index}
            className="rounded-[3px] bg-[#5865f2]/30 px-0.5 font-medium text-[#c9cdfb]"
          >
            {node.text}
          </span>
        );
      case "time":
        return (
          <span key={index} className="rounded-[3px] bg-white/10 px-0.5">
            {node.text}
          </span>
        );
      case "emoji":
        return (
          <span key={index} className="text-[#b5bac1]">
            :{node.name}:
          </span>
        );
      default:
        return null;
    }
  });
}

/**
 * A message body: code blocks, headings, subtext, quotes and lists on top of
 * the inline formatting. `inline` skips the block rules (for embed titles).
 */
export function DiscordMarkdown({
  text,
  className,
  inline = false,
}: {
  text: string;
  className?: string;
  inline?: boolean;
}) {
  if (!text) return null;
  if (inline)
    return <span className={className}>{renderInline(parseInline(text))}</span>;

  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let quoteRest = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (line.trimStart().startsWith("```")) {
      const fence = line.trimStart();
      const firstLine = fence.slice(3);
      const closingOnSameLine =
        firstLine.endsWith("```") && firstLine.length >= 3;
      const body: string[] = [];
      if (closingOnSameLine) {
        body.push(firstLine.slice(0, -3));
      } else {
        // a bare word after the fence is the language, not code
        if (firstLine && !/^[\w+-]+$/.test(firstLine)) body.push(firstLine);
        while (
          ++index < lines.length &&
          !lines[index].trimEnd().endsWith("```")
        ) {
          body.push(lines[index]);
        }
        if (index < lines.length) {
          const last = lines[index].trimEnd().slice(0, -3);
          if (last) body.push(last);
        }
      }
      blocks.push(
        <pre
          key={blocks.length}
          className="my-1 overflow-x-auto rounded border border-[#1e1f22] bg-[#2b2d31] p-2 font-mono text-[0.85em] whitespace-pre-wrap"
        >
          {body.join("\n")}
        </pre>,
      );
      continue;
    }

    let content = line;
    let quoted = quoteRest;
    if (content.startsWith(">>> ")) {
      quoteRest = true;
      quoted = true;
      content = content.slice(4);
    } else if (content.startsWith("> ")) {
      quoted = true;
      content = content.slice(2);
    }

    const heading = /^(#{1,3}) (.+)$/.exec(content);
    const subtext = /^-# (.+)$/.exec(content);
    const bullet = /^(\s*)[-*] (.+)$/.exec(content);
    const numbered = /^(\s*)(\d{1,9})\. (.+)$/.exec(content);

    let body: ReactNode;
    if (heading) {
      const size = ["text-2xl", "text-xl", "text-base"][heading[1].length - 1];
      body = (
        <span className={cn("my-1 block leading-snug font-bold", size)}>
          {renderInline(parseInline(heading[2]))}
        </span>
      );
    } else if (subtext) {
      body = (
        <span className="block text-xs text-[#949ba4]">
          {renderInline(parseInline(subtext[1]))}
        </span>
      );
    } else if (bullet) {
      body = (
        <span
          className="flex gap-2"
          style={{ paddingLeft: `${bullet[1].length * 8 + 4}px` }}
        >
          <span aria-hidden>•</span>
          <span className="min-w-0">
            {renderInline(parseInline(bullet[2]))}
          </span>
        </span>
      );
    } else if (numbered) {
      body = (
        <span
          className="flex gap-2"
          style={{ paddingLeft: `${numbered[1].length * 8 + 4}px` }}
        >
          <span>{numbered[2]}.</span>
          <span className="min-w-0">
            {renderInline(parseInline(numbered[3]))}
          </span>
        </span>
      );
    } else {
      body = (
        <span className="block min-h-[1.375em]">
          {renderInline(parseInline(content))}
        </span>
      );
    }

    blocks.push(
      quoted ? (
        <span key={blocks.length} className="flex">
          <span
            aria-hidden
            className="mr-2 w-1 shrink-0 rounded-sm bg-[#4e5058]"
          />
          <span className="min-w-0 flex-1">{body}</span>
        </span>
      ) : (
        <span key={blocks.length} className="block">
          {body}
        </span>
      ),
    );
  }

  return <div className={cn("wrap-anywhere", className)}>{blocks}</div>;
}
