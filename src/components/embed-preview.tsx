import Image from "next/image";

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
  return (
    <div
      className="rounded-md overflow-hidden max-w-[520px]"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="bg-[#2f3136] p-3 rounded-tr-md rounded-br-md">
        {author && (
          <div className="flex items-center gap-2 mb-2">
            {authorIcon && (
              <Image src={authorIcon} alt="" className="rounded-full w-6 h-6 object-cover" height={24} width={24}/>
            )}
            <span className="text-sm font-medium">{author}</span>
          </div>
        )}

        <div className="flex">
          <div className="flex-1 min-w-0" style={{ wordBreak: "break-word" }}>
            {title && (
              <div className="font-semibold mb-1">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00b0f4] hover:underline"
                  >
                    {title}
                  </a>
                ) : (
                  title
                )}
              </div>
            )}
            {description && (
              <div
                className="text-sm text-gray-300 whitespace-pre-wrap mb-2"
              >
                {description}
              </div>
            )}

            {fields && fields.length > 0 && (
              <div className="grid grid-cols-12 gap-2 mt-2">
                {fields.map((field, i) => (
                  <div
                    key={i}
                    className={`${
                      field.inline ? "col-span-4" : "col-span-12"
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-200 mb-0.5">
                      {field.name}
                    </div>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {image && (
              <div className="mt-3">
                <Image
                  src={image}
                  alt=""
                  className="max-w-full rounded-md max-h-[300px] object-contain"
                  width={400}
                  height={300}
                />
              </div>
            )}

            {(footer || timestamp) && (
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                {footerIcon && (
                  <Image
                    src={footerIcon}
                    alt=""
                    className="rounded-full w-5 h-5 object-cover"
                    width={20}
                    height={20}
                  />
                )}
                <span>
                  {footer}
                  {footer && timestamp && " • "}
                  {timestamp && new Date(timestamp).toLocaleDateString() + " " + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {thumbnail && (
            <div className="ml-4 flex-shrink-0">
              <Image
                src={thumbnail}
                alt=""
                className="object-cover rounded-md w-20 h-20"
                height={80}
                width={80}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
