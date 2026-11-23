"use client";

import { Copy, Pencil, Send, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DiscordMarkdown } from "@/components/discord-markdown";
import { EmbedPreview } from "@/components/embed-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, mono, Section } from "@/components/kit";
import type { WebhookHistoryItem, WebhookPayload } from "@/lib/webhook";
import { readErrorMessage } from "@/lib/webhook";

interface WebhookHistoryProps {
  history: WebhookHistoryItem[];
  setHistory: (history: WebhookHistoryItem[]) => void;
  /** Loads a sent message into the composer to change it */
  onEdit: (item: WebhookHistoryItem) => void;
  /** Deletes a sent message from Discord */
  onDelete: (item: WebhookHistoryItem) => void;
}

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(dateString));

// The webhook's ID and the start of its token: enough to tell webhooks apart
const shortWebhook = (url: string) => {
  const match = /webhooks\/(\d+)\/([\w-]{6})/.exec(url);
  return match ? `${match[1]} · ${match[2]}…` : url;
};

export function WebhookHistory({
  history,
  setHistory,
  onEdit,
  onDelete,
}: WebhookHistoryProps) {
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const copyPayload = async (payload: WebhookPayload) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success("Copied to clipboard!", {
        description: "The message JSON",
      });
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const resendWebhook = async (
    index: number,
    webhookUrl: string,
    payload: WebhookPayload,
  ) => {
    setBusy(index);
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      toast.success("Webhook resent", {
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      toast.error("Error sending webhook", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Section
      title="History"
      description="Messages sent from this browser. Ones sent since this update can be edited or deleted in Discord."
      actions={
        history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className={mono}
            onClick={() => setHistory([])}
          >
            Clear history
          </Button>
        )
      }
    >
      <div className="my-2">
        {history.length === 0 ? (
          <Empty>No webhook history yet. Send a message to see it here.</Empty>
        ) : (
          <ul className="space-y-2">
            {history.map((item, index) => (
              <li
                key={`${item.timestamp}-${index}`}
                className="rounded-xl border border-border/40 bg-accent p-3 text-sm dark:bg-muted/40"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {formatDate(item.timestamp)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {shortWebhook(item.webhookUrl)}
                  </span>
                  {item.edited && !item.deleted && (
                    <Badge variant="secondary">Edited</Badge>
                  )}
                  {item.deleted && <Badge variant="destructive">Deleted</Badge>}
                  <div className="ml-auto flex flex-wrap gap-1.5">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Copy JSON"
                      title="Copy JSON"
                      onClick={() => copyPayload(item.payload)}
                    >
                      <Copy />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Send again"
                      title="Send again"
                      onClick={() =>
                        resendWebhook(index, item.webhookUrl, item.payload)
                      }
                      disabled={busy === index}
                    >
                      <Send />
                    </Button>
                    {item.messageId && !item.deleted && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className={mono}
                          onClick={() => onEdit(item)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          variant={
                            confirmDelete === index ? "destructive" : "outline"
                          }
                          size="sm"
                          className={mono}
                          onClick={() => {
                            if (confirmDelete !== index) {
                              setConfirmDelete(index);
                              return;
                            }
                            setConfirmDelete(null);
                            onDelete(item);
                          }}
                          onBlur={() => setConfirmDelete(null)}
                        >
                          <Trash2 />
                          {confirmDelete === index
                            ? "Delete in Discord?"
                            : "Delete"}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove from history"
                      title="Remove from history (stays in Discord)"
                      onClick={() =>
                        setHistory(history.filter((_, i) => i !== index))
                      }
                    >
                      <X />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg bg-[#313338] p-3 text-sm text-[#dbdee1]">
                  {item.payload.username && (
                    <p className="font-medium text-white">
                      {item.payload.username}
                    </p>
                  )}
                  {item.payload.content && (
                    <DiscordMarkdown text={item.payload.content} />
                  )}
                  {item.payload.embeds?.map((embed, embedIndex) => (
                    <EmbedPreview
                      key={embedIndex}
                      title={embed.title}
                      description={embed.description}
                      color={
                        typeof embed.color === "number"
                          ? `#${embed.color.toString(16).padStart(6, "0")}`
                          : undefined
                      }
                      author={embed.author?.name}
                      authorIcon={embed.author?.icon_url}
                      footer={embed.footer?.text}
                      footerIcon={embed.footer?.icon_url}
                      thumbnail={embed.thumbnail?.url}
                      image={embed.image?.url}
                      fields={embed.fields}
                      timestamp={embed.timestamp}
                    />
                  ))}
                  {item.payload.poll && (
                    <p className="text-xs text-[#949ba4]">
                      Poll: {item.payload.poll.question.text}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
