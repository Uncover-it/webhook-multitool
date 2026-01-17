"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Send } from "lucide-react";
import { toast } from "sonner";
import { EmbedPreview } from "@/components/embed-preview";

interface WebhookEmbed {
  title?: string;
  description?: string;
  color?: number;
  author?: { name: string; icon_url?: string };
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
}

interface WebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: WebhookEmbed[];
  tts?: boolean;
}

interface WebhookHistoryItem {
  timestamp: string;
  payload: WebhookPayload;
  webhookUrl: string;
}

interface WebhookHistoryProps {
  history: WebhookHistoryItem[];
}

export function WebhookHistory({ history }: WebhookHistoryProps) {
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  const copyPayload = (payload: WebhookPayload) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.info("Copied", {
      description: "Webhook payload copied to clipboard",
    });
  };

  const resendWebhook = async (
    index: number,
    webhookUrl: string,
    payload: WebhookPayload
  ) => {
    setLoading((prev) => ({ ...prev, [index]: true }));

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      toast.success("Webhook resent", {
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      console.error("Error sending webhook:", error);
      toast.error("Error sending webhook", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const clearHistory = () => {
    localStorage.removeItem("webhookHistory");
    window.location.reload();
  };

  const deleteHistoryItem = (index: number) => {
    const newHistory = [...history];
    newHistory.splice(index, 1);
    localStorage.setItem("webhookHistory", JSON.stringify(newHistory));
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Webhook History</CardTitle>
          <CardDescription>
            Your previously sent webhook messages
          </CardDescription>
        </div>
        {history.length > 0 && (
          <Button variant="destructive" onClick={clearHistory}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-muted-foreground">
            No webhook history yet. Send a webhook to see it here.
          </p>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {history.map((item, index) => (
                <Card key={index} className="border-muted">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-medium leading-none mb-1.5">
                          {formatDate(item.timestamp)}
                        </CardTitle>
                        <CardDescription className="truncate text-xs" title={item.webhookUrl}>
                          {item.webhookUrl}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyPayload(item.payload)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            resendWebhook(index, item.webhookUrl, item.payload)
                          }
                          disabled={loading[index]}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => deleteHistoryItem(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="bg-[#36393f] text-white rounded-md p-3">
                      {item.payload.username && (
                        <div className="flex items-center gap-2 mb-2">
                          {item.payload.avatar_url ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden">
                              <Image
                                src={item.payload.avatar_url}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                          )}
                          <span className="font-semibold text-sm">
                            {item.payload.username}
                          </span>
                        </div>
                      )}

                      {item.payload.content && (
                        <p className="text-sm mb-2 break-words">
                          {item.payload.content}
                        </p>
                      )}

                      {item.payload.embeds &&
                        item.payload.embeds.length > 0 && (
                          <div className="space-y-2">
                            {item.payload.embeds.map(
                              (embed: WebhookEmbed, embedIndex: number) => (
                                <EmbedPreview
                                  key={embedIndex}
                                  title={embed.title}
                                  description={embed.description}
                                  color={
                                    embed.color
                                      ? `#${embed.color
                                          .toString(16)
                                          .padStart(6, "0")}`
                                      : undefined
                                  }
                                  author={embed.author?.name}
                                  authorIcon={embed.author?.icon_url}
                                  footer={embed.footer?.text}
                                  footerIcon={embed.footer?.icon_url}
                                  thumbnail={embed.thumbnail?.url}
                                  image={embed.image?.url}
                                />
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
