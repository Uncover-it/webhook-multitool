// Types and helpers for Discord's webhook API, shared by the composer, the
// history and the JSON tools

export interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

/** An embed as the form edits it: every field a string, colour as #rrggbb. */
export interface EmbedState {
  title: string;
  description: string;
  color: string;
  author: string;
  authorIcon: string;
  footer: string;
  footerIcon: string;
  thumbnail: string;
  image: string;
  fields: EmbedField[];
  timestamp?: string;
  url: string;
}

export const makeEmbed = (): EmbedState => ({
  title: "",
  description: "",
  color: "#5865F2",
  author: "",
  authorIcon: "",
  footer: "",
  footerIcon: "",
  thumbnail: "",
  image: "",
  fields: [],
  url: "",
});

export interface WebhookEmbed {
  title?: string;
  description?: string;
  color?: number;
  author?: { name: string; icon_url?: string };
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
  url?: string;
}

export interface WebhookPoll {
  question: { text: string };
  answers: { poll_media: { text: string } }[];
  allow_multiselect: boolean;
  duration: number;
  layout_type?: number;
}

export type MentionKind = "users" | "roles" | "everyone";

export interface WebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: WebhookEmbed[];
  tts?: boolean;
  flags?: number;
  poll?: WebhookPoll;
  allowed_mentions?: { parse: MentionKind[] };
}

export interface WebhookHistoryItem {
  timestamp: string;
  payload: WebhookPayload;
  webhookUrl: string;
  /** Set for messages sent since the history kept IDs; older ones can't be edited */
  messageId?: string;
  channelId?: string;
  threadId?: string;
  edited?: boolean;
  deleted?: boolean;
}

export const FLAG_SUPPRESS_EMBEDS = 1 << 2;
export const FLAG_SILENT = 1 << 12;

export function stateToEmbed(state: EmbedState): WebhookEmbed {
  const embed: WebhookEmbed = {};
  if (state.title) embed.title = state.title;
  if (state.description) embed.description = state.description;
  if (state.color)
    embed.color = Number.parseInt(state.color.replace("#", ""), 16);
  if (state.author) {
    embed.author = { name: state.author };
    if (state.authorIcon) embed.author.icon_url = state.authorIcon;
  }
  if (state.footer) {
    embed.footer = { text: state.footer };
    if (state.footerIcon) embed.footer.icon_url = state.footerIcon;
  }
  if (state.thumbnail) embed.thumbnail = { url: state.thumbnail };
  if (state.image) embed.image = { url: state.image };
  if (state.fields.length > 0) embed.fields = state.fields;
  if (state.timestamp) embed.timestamp = state.timestamp;
  if (state.url) embed.url = state.url;
  return embed;
}

export function embedToState(embed: WebhookEmbed): EmbedState {
  return {
    ...makeEmbed(),
    title: embed.title ?? "",
    description: embed.description ?? "",
    color:
      typeof embed.color === "number"
        ? `#${embed.color.toString(16).padStart(6, "0")}`
        : "#5865F2",
    author: embed.author?.name ?? "",
    authorIcon: embed.author?.icon_url ?? "",
    footer: embed.footer?.text ?? "",
    footerIcon: embed.footer?.icon_url ?? "",
    thumbnail: embed.thumbnail?.url ?? "",
    image: embed.image?.url ?? "",
    fields: (embed.fields ?? []).map((field) => ({
      name: field.name ?? "",
      value: field.value ?? "",
      inline: Boolean(field.inline),
    })),
    timestamp: embed.timestamp,
    url: embed.url ?? "",
  };
}

export const WEBHOOK_URL_PATTERN =
  /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+\/?$/;

/** The URL of one message sent by this webhook, for GET, PATCH and DELETE. */
export function messageUrl(
  webhookUrl: string,
  messageId: string,
  threadId?: string,
) {
  const url = new URL(`${webhookUrl.replace(/\/$/, "")}/messages/${messageId}`);
  if (threadId) url.searchParams.set("thread_id", threadId);
  return url.toString();
}

/** A message ID from a raw ID or a "Copy Message Link" URL. */
export function parseMessageRef(input: string) {
  const trimmed = input.trim();
  if (/^\d{15,22}$/.test(trimmed)) return { messageId: trimmed };
  const link = /discord(?:app)?\.com\/channels\/(?:\d+|@me)\/(\d+)\/(\d+)/.exec(
    trimmed,
  );
  return link ? { channelId: link[1], messageId: link[2] } : null;
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Error: ${response.status} ${response.statusText}`;
  try {
    const body = await response.json();
    return typeof body?.message === "string" && body.message
      ? body.message
      : fallback;
  } catch {
    return fallback;
  }
}

export async function readRetryAfter(response: Response): Promise<number> {
  const header = Number.parseFloat(response.headers.get("retry-after") ?? "");
  if (Number.isFinite(header) && header > 0) return header * 1000;
  try {
    const body = await response.json();
    if (typeof body?.retry_after === "number" && body.retry_after > 0) {
      return body.retry_after * 1000;
    }
  } catch {}
  return 1000;
}

export function buildRequestInit(payload: WebhookPayload, files: File[]) {
  if (files.length === 0) {
    return {
      body: JSON.stringify(payload) as string | FormData,
      headers: { "Content-Type": "application/json" } as Record<string, string>,
    };
  }
  const formData = new FormData();
  formData.append("payload_json", JSON.stringify(payload));
  files.forEach((file, index) => {
    formData.append(`file${index}`, file);
  });
  return {
    body: formData as string | FormData,
    headers: {} as Record<string, string>,
  };
}
