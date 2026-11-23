/** biome-ignore-all lint/performance/noImgElement: these are arbitrary URLs the user typed, which next/image can neither optimise in a static export nor load without a configured host */
import { DiscordMarkdown } from "@/components/discord-markdown";

interface EmbedPreviewProps {
  title?: string;
  description?: string;
  color?: string;
  author?: string;
  authorIcon?: string;
  footer?: string;
  footerIcon?: string;
  thumbnail?: string;
  image?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string; // ISO string
  url?: string;
}

export function EmbedPreview({
  title,
  description,
  color = "#5865F2",
  author,
  authorIcon,
  footer,
  footerIcon,
  thumbnail,
  image,
  fields = [],
  timestamp,
  url,
}: EmbedPreviewProps) {
  // Discord lays inline fields out three to a row
  const rows: { name: string; value: string; inline?: boolean }[][] = [];
  for (const field of fields) {
    const last = rows.at(-1);
    if (field.inline && last && last.length < 3 && last.every((f) => f.inline))
      last.push(field);
    else rows.push([field]);
  }

  return (
    <div
      className="max-w-[520px] overflow-hidden rounded-[4px] border-l-4 bg-[#2b2d31]"
      style={{ borderLeftColor: color }}
    >
      <div className="flex gap-4 p-3 pr-4">
        <div className="min-w-0 flex-1 space-y-2">
          {author && (
            <div className="flex items-center gap-2">
              {authorIcon && (
                <img
                  src={authorIcon}
                  alt=""
                  className="size-6 rounded-full object-cover"
                />
              )}
              <span className="text-sm font-semibold">{author}</span>
            </div>
          )}
          {title && (
            <div
              className={url ? "font-semibold text-[#00a8fc]" : "font-semibold"}
            >
              <DiscordMarkdown text={title} inline />
            </div>
          )}
          {description && (
            <DiscordMarkdown
              text={description}
              className="text-sm text-[#dbdee1]"
            />
          )}
          {rows.length > 0 && (
            <div className="space-y-2">
              {rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
                  }}
                >
                  {row.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="min-w-0">
                      <div className="mb-0.5 text-sm font-semibold">
                        <DiscordMarkdown text={field.name} inline />
                      </div>
                      <DiscordMarkdown
                        text={field.value}
                        className="text-sm text-[#dbdee1]"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {image && (
            <img
              src={image}
              alt=""
              className="max-h-[300px] w-auto max-w-full rounded-[4px] object-contain"
            />
          )}
          {(footer || timestamp) && (
            <div className="flex items-center gap-2 text-xs text-[#b5bac1]">
              {footerIcon && (
                <img
                  src={footerIcon}
                  alt=""
                  className="size-5 rounded-full object-cover"
                />
              )}
              <span>
                {footer}
                {footer && timestamp && " • "}
                {timestamp &&
                  new Date(timestamp).toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
              </span>
            </div>
          )}
        </div>
        {thumbnail && (
          <img
            src={thumbnail}
            alt=""
            className="size-20 shrink-0 rounded-[4px] object-cover"
          />
        )}
      </div>
    </div>
  );
}
