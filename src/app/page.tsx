"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  Copy,
  Save,
  Send,
  Trash2,
  MoonStar,
  Sun,
  CircleStop,
  Play,
  Plus,
  Paperclip,
  X,
  ChevronDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ColorPicker } from "@/components/color-picker";
import { WebhookHistory } from "@/components/webhook-history";
import { EmbedPreview } from "@/components/embed-preview";
import { PollPreview } from "@/components/poll-preview";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import github from "@/../public/github.svg";
import discord from "@/../public/discord.svg";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EmbedState {
  title: string;
  description: string;
  color: string;
  author: string;
  authorIcon: string;
  footer: string;
  footerIcon: string;
  thumbnail: string;
  image: string;
  fields: { name: string; value: string; inline: boolean }[];
  timestamp?: string;
  url: string;
}

const initialEmbedState: EmbedState = {
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
};

interface WebhookEmbed {
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

interface WebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: WebhookEmbed[];
  tts?: boolean;
  flags?: number;
}

interface WebhookHistoryItem {
  timestamp: string;
  payload: WebhookPayload;
  webhookUrl: string;
}

interface WebhookEditPayload {
  name?: string;
  avatar?: string;
}

export default function WebhookTool() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savedWebhooks, setSavedWebhooks] = useState<
    { name: string; url: string }[]
  >([]);
  const [webhookName, setWebhookName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [threadId, setThreadId] = useState("");
  const [content, setContent] = useState("");

  const [embeds, setEmbeds] = useState<EmbedState[]>([initialEmbedState]);
  const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);

  const [useEmbed, setUseEmbed] = useState(false);
  const [useTTS, setUseTTS] = useState(false);
  const [suppressEmbeds, setSuppressEmbeds] = useState(false);
  const [silentMessage, setSilentMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [usePoll, setUsePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollAnswers, setPollAnswers] = useState<
    { text: string; emoji?: string }[]
  >([{ text: "" }, { text: "" }]);
  const [pollAllowMultiselect, setPollAllowMultiselect] = useState(false);
  const [pollDuration, setPollDuration] = useState(24);
  const [history, setHistory] = useState<WebhookHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("message");
  const [isSpamming, setIsSpamming] = useState(false);
  const [useSpam, setUseSpam] = useState(false);
  const spamRef = useRef<{ stop: boolean }>({ stop: false });

  useEffect(() => {
    const saved = localStorage.getItem("savedWebhooks");
    if (saved) {
      setSavedWebhooks(JSON.parse(saved));
    }

    const historyData = localStorage.getItem("webhookHistory");
    if (historyData) {
      setHistory(JSON.parse(historyData));
    }
  }, []);

  const { theme, setTheme } = useTheme();
  const saveWebhook = () => {
    if (!webhookUrl || !webhookName) {
      toast.error("Error", {
        description: "Please provide both a name and URL for the webhook",
      });
      return;
    }

    const newWebhooks = [
      ...savedWebhooks,
      { name: webhookName, url: webhookUrl },
    ];
    setSavedWebhooks(newWebhooks);
    localStorage.setItem("savedWebhooks", JSON.stringify(newWebhooks));

    toast.success("Webhook saved", {
      description: `Webhook "${webhookName}" has been saved`,
    });

    setWebhookName("");
  };

  const deleteWebhook = (index: number) => {
    const newWebhooks = [...savedWebhooks];
    newWebhooks.splice(index, 1);
    setSavedWebhooks(newWebhooks);
    localStorage.setItem("savedWebhooks", JSON.stringify(newWebhooks));

    toast.success("Webhook deleted", {
      description: "The webhook has been removed from your saved list",
    });
  };

  const selectWebhook = (url: string) => {
    setWebhookUrl(url);
  };

  const editWebhook = async () => {
    setLoading(true);

    try {
      const payload: WebhookEditPayload = {};
      if (username) payload.name = username;
      if (avatarUrl) {
        const res = await fetch(avatarUrl);
        const blob = await res.blob();
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        payload.avatar = base64;
      }

      const response = await fetch(webhookUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Webhook edited", {
        description: "The webhook has been updated successfully",
      });
    } catch (error) {
      toast.error("Error editing webhook", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const sendWebhook = async () => {
    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: WebhookPayload & { poll?: any } = {};

      if (username) payload.username = username;
      if (avatarUrl) payload.avatar_url = avatarUrl;
      if (content) payload.content = content;

      let flags = 0;
      if (suppressEmbeds) flags |= 1 << 2;
      if (silentMessage) flags |= 1 << 12;
      if (flags > 0) payload.flags = flags;

      if (useEmbed) {
        payload.embeds = embeds.map((embedState) => {
          const embed: WebhookEmbed = {};
          if (embedState.title) embed.title = embedState.title;
          if (embedState.description)
            embed.description = embedState.description;
          if (embedState.color)
            embed.color = Number.parseInt(
              embedState.color.replace("#", ""),
              16,
            );

          if (embedState.author) {
            embed.author = { name: embedState.author };
            if (embedState.authorIcon)
              embed.author.icon_url = embedState.authorIcon;
          }

          if (embedState.footer) {
            embed.footer = { text: embedState.footer };
            if (embedState.footerIcon)
              embed.footer.icon_url = embedState.footerIcon;
          }

          if (embedState.thumbnail)
            embed.thumbnail = { url: embedState.thumbnail };
          if (embedState.image) embed.image = { url: embedState.image };
          if (embedState.fields && embedState.fields.length > 0) {
            embed.fields = embedState.fields;
          }
          if (embedState.timestamp) embed.timestamp = embedState.timestamp;
          if (embedState.url) embed.url = embedState.url;

          return embed;
        });
      }

      if (usePoll) {
        if (!pollQuestion.trim()) {
          throw new Error("Poll question cannot be empty");
        }
        if (pollAnswers.some((a) => !a.text.trim())) {
          throw new Error("All poll answers must have text");
        }
        if (pollAnswers.length < 2) {
          throw new Error("Poll must have at least 2 answers");
        }

        payload.poll = {
          question: { text: pollQuestion },
          answers: pollAnswers.map((a) => ({ poll_media: { text: a.text } })),
          allow_multiselect: pollAllowMultiselect,
          duration: pollDuration,
          layout_type: 1,
        };
      }

      const finalPayload = useTTS ? { ...payload, tts: true } : payload;
      let body: string | FormData = JSON.stringify(finalPayload);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (files.length > 0) {
        const formData = new FormData();
        formData.append("payload_json", JSON.stringify(finalPayload));
        files.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });
        body = formData;
        delete headers["Content-Type"];
      }

      const url = new URL(webhookUrl);
      if (threadId) {
        url.searchParams.append("thread_id", threadId);
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers,
        body,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const historyItem: WebhookHistoryItem = {
        timestamp: new Date().toISOString(),
        payload,
        webhookUrl,
      };

      const newHistory = [historyItem, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem("webhookHistory", JSON.stringify(newHistory));

      toast.success("Webhook sent", {
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      toast.error("Error sending webhook", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const startSpam = async () => {
    setIsSpamming(true);
    spamRef.current.stop = false;
    const payload: WebhookPayload & { poll?: any } = {};
    if (username) payload.username = username;
    if (avatarUrl) payload.avatar_url = avatarUrl;
    if (content) payload.content = content;

    let flags = 0;
    if (suppressEmbeds) flags |= 1 << 2;
    if (silentMessage) flags |= 1 << 12;
    if (flags > 0) payload.flags = flags;

    if (useEmbed) {
      payload.embeds = embeds.map((embedState) => {
        const embed: WebhookEmbed = {};
        if (embedState.title) embed.title = embedState.title;
        if (embedState.description) embed.description = embedState.description;
        if (embedState.color)
          embed.color = Number.parseInt(embedState.color.replace("#", ""), 16);
        if (embedState.author) {
          embed.author = { name: embedState.author };
          if (embedState.authorIcon)
            embed.author.icon_url = embedState.authorIcon;
        }
        if (embedState.footer) {
          embed.footer = { text: embedState.footer };
          if (embedState.footerIcon)
            embed.footer.icon_url = embedState.footerIcon;
        }
        if (embedState.thumbnail)
          embed.thumbnail = { url: embedState.thumbnail };
        if (embedState.image) embed.image = { url: embedState.image };
        if (embedState.fields && embedState.fields.length > 0) {
          embed.fields = embedState.fields;
        }
        if (embedState.timestamp) embed.timestamp = embedState.timestamp;
        if (embedState.url) embed.url = embedState.url;
        return embed;
      });
    }

    if (usePoll) {
      if (!pollQuestion.trim()) {
        toast.error("Poll Error", {
          description: "Poll question cannot be empty",
        });
        setIsSpamming(false);
        spamRef.current.stop = true;
        return;
      }
      if (pollAnswers.some((a) => !a.text.trim())) {
        toast.error("Poll Error", {
          description: "All poll answers must have text",
        });
        setIsSpamming(false);
        spamRef.current.stop = true;
        return;
      }
      if (pollAnswers.length < 2) {
        toast.error("Poll Error", {
          description: "Poll must have at least 2 answers",
        });
        setIsSpamming(false);
        spamRef.current.stop = true;
        return;
      }

      payload.poll = {
        question: { text: pollQuestion },
        answers: pollAnswers.map((a) => ({ poll_media: { text: a.text } })),
        allow_multiselect: pollAllowMultiselect,
        duration: pollDuration,
        layout_type: 1,
      };
    }

    const spam = async () => {
      toast.info("Spamming started", {
        description: "Spamming the webhook.",
      });
      while (!spamRef.current.stop) {
        let response: Response | undefined;
        try {
          const url = new URL(webhookUrl);
          if (threadId) {
            url.searchParams.append("thread_id", threadId);
          }

          const finalPayload = useTTS ? { ...payload, tts: true } : payload;

          let body: string | FormData = JSON.stringify(finalPayload);
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          if (files.length > 0) {
            const formData = new FormData();
            formData.append("payload_json", JSON.stringify(finalPayload));
            files.forEach((file, index) => {
              formData.append(`file${index}`, file);
            });
            body = formData;
            delete headers["Content-Type"];
          }

          response = await fetch(url.toString(), {
            method: "POST",
            headers,
            body,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }
        } catch (error) {
          if (!response || response.status !== 429) {
            toast.error("Error sending webhook", {
              description:
                error instanceof Error ? error.message : String(error),
            });
            spamRef.current.stop = true;
            setIsSpamming(false);
          }
        }
      }
    };
    spam();
  };

  const stopSpam = () => {
    spamRef.current.stop = true;
    setIsSpamming(false);
    toast.info("Spam stopped", {
      description: "Stopped spamming the webhook.",
    });
  };

  const clearForm = () => {
    setContent("");
    setEmbeds([initialEmbedState]);
    setActiveEmbedIndex(0);
    setUseEmbed(false);
    setUseTTS(false);
    setSuppressEmbeds(false);
    setSilentMessage(false);
    setFiles([]);
    setUsePoll(false);
    setPollQuestion("");
    setPollAnswers([{ text: "" }, { text: "" }]);
    setPollAllowMultiselect(false);
    setPollDuration(24);
  };

  const updateEmbed = (index: number, field: keyof EmbedState, value: any) => {
    const newEmbeds = [...embeds];
    newEmbeds[index] = { ...newEmbeds[index], [field]: value };
    setEmbeds(newEmbeds);
  };

  const addField = (embedIndex: number) => {
    const newEmbeds = [...embeds];
    if (newEmbeds[embedIndex].fields.length < 25) {
      newEmbeds[embedIndex].fields.push({
        name: "",
        value: "",
        inline: false,
      });
      setEmbeds(newEmbeds);
    }
  };

  const removeField = (embedIndex: number, fieldIndex: number) => {
    const newEmbeds = [...embeds];
    newEmbeds[embedIndex].fields.splice(fieldIndex, 1);
    setEmbeds(newEmbeds);
  };

  const updateField = (
    embedIndex: number,
    fieldIndex: number,
    key: "name" | "value" | "inline",
    value: any,
  ) => {
    const newEmbeds = [...embeds];
    newEmbeds[embedIndex].fields[fieldIndex] = {
      ...newEmbeds[embedIndex].fields[fieldIndex],
      [key]: value,
    };
    setEmbeds(newEmbeds);
  };

  const addEmbed = () => {
    if (embeds.length < 10) {
      setEmbeds([...embeds, initialEmbedState]);
      setActiveEmbedIndex(embeds.length);
    }
  };

  const removeEmbed = (index: number) => {
    if (embeds.length > 1) {
      const newEmbeds = embeds.filter((_, i) => i !== index);
      setEmbeds(newEmbeds);
      if (activeEmbedIndex >= newEmbeds.length) {
        setActiveEmbedIndex(newEmbeds.length - 1);
      }
    }
  };

  const addPollAnswer = () => {
    if (pollAnswers.length < 10) {
      setPollAnswers([...pollAnswers, { text: "" }]);
    }
  };

  const removePollAnswer = (index: number) => {
    if (pollAnswers.length > 1) {
      const newAnswers = [...pollAnswers];
      newAnswers.splice(index, 1);
      setPollAnswers(newAnswers);
    }
  };

  const updatePollAnswer = (index: number, text: string) => {
    const newAnswers = [...pollAnswers];
    newAnswers[index].text = text;
    setPollAnswers(newAnswers);
  };

  return (
    <div className="container mx-auto py-8 px-4 relative">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Discord Webhook Multi-Tool
      </h1>

      <Tabs
        defaultValue="message"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="message">Message</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="message" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Enter your webhook URL and customize the sender
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    disabled={isSpamming}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Delete Webhook"
                          variant="destructive"
                          size="icon"
                          {...(webhookUrl ? {} : { disabled: true })}
                          onClick={async () => {
                            if (!webhookUrl) return;
                            try {
                              const response = await fetch(webhookUrl, {
                                method: "DELETE",
                              });
                              if (response.ok) {
                                setWebhookUrl("");
                                toast.success("Webhook deleted", {
                                  description:
                                    "The webhook has been deleted from Discord.",
                                });
                              } else {
                                toast.error("Failed to delete webhook", {
                                  description: `Error: ${response.status} ${response.statusText}`,
                                });
                              }
                            } catch (error) {
                              toast.error("Error deleting webhook", {
                                description:
                                  error instanceof Error
                                    ? error.message
                                    : "Unknown error occurred",
                              });
                            }
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Webhook</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {savedWebhooks.length > 0 && (
                    <div className="relative">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full">
                            Saved
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-0">
                          <div className="max-h-75 overflow-auto">
                            {savedWebhooks.map((webhook, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                                onClick={() => selectWebhook(webhook.url)}
                              >
                                <span className="truncate">{webhook.name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteWebhook(index);
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Override Username (optional)</Label>
                  <Input
                    id="username"
                    placeholder="Custom Bot Name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSpamming}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar-url">Avatar URL (optional)</Label>
                  <Input
                    id="avatar-url"
                    placeholder="https://example.com/avatar.png"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    disabled={isSpamming}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thread-id">Thread ID (optional)</Label>
                <Input
                  id="thread-id"
                  placeholder="123456789012345678"
                  value={threadId}
                  onChange={(e) => setThreadId(e.target.value)}
                  disabled={isSpamming}
                />
                <p className="text-[0.8rem] text-muted-foreground">
                  Send message into a specific thread (must be created first)
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Message Content</CardTitle>
                  <CardDescription>
                    Compose your webhook message
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">Text Message</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter your message here..."
                      className="min-h-25"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={isSpamming}
                    />

                    <div className="space-y-2">
                      <Label>Attachments</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm border"
                          >
                            <span className="truncate max-w-37.5">
                              {file.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 rounded-full"
                              onClick={() => {
                                const newFiles = [...files];
                                newFiles.splice(index, 1);
                                setFiles(newFiles);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById("file-upload")?.click()
                          }
                          disabled={isSpamming || files.length >= 10}
                        >
                          <Paperclip className="size-4 mr-2" />
                          Add Files
                        </Button>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              const newFiles = Array.from(e.target.files);
                              if (files.length + newFiles.length > 10) {
                                toast.error("Limit Exceeded", {
                                  description:
                                    "You can only attach up to 10 files.",
                                });
                                return;
                              }
                              setFiles([...files, ...newFiles]);
                            }
                            e.target.value = "";
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Max 10 files, 25MB total (default Discord limit)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="use-embed"
                        checked={useEmbed}
                        onCheckedChange={setUseEmbed}
                        disabled={isSpamming}
                      />
                      <Label htmlFor="use-embed">Include Embed</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="use-poll"
                        checked={usePoll}
                        onCheckedChange={setUsePoll}
                        disabled={isSpamming}
                      />
                      <Label htmlFor="use-poll">Poll</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="use-tts"
                        checked={useTTS}
                        onCheckedChange={setUseTTS}
                        disabled={isSpamming}
                      />
                      <Label htmlFor="use-tts">TTS</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="suppress-embeds"
                        checked={suppressEmbeds}
                        onCheckedChange={setSuppressEmbeds}
                        disabled={isSpamming || useEmbed}
                      />
                      <Label htmlFor="suppress-embeds">Hide Embeds</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="silent-message"
                        checked={silentMessage}
                        onCheckedChange={setSilentMessage}
                        disabled={isSpamming}
                      />
                      <Label htmlFor="silent-message">Silent</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="spam"
                        checked={useSpam}
                        onCheckedChange={setUseSpam}
                        disabled={isSpamming}
                      />
                      <Label htmlFor="spam">Spam</Label>
                    </div>
                  </div>

                  {usePoll && (
                    <Card className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Poll Question</Label>
                        <Input
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          placeholder="What is your favorite color?"
                          disabled={isSpamming}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Answers (Min 1, Max 10)</Label>
                        {pollAnswers.map((answer, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={answer.text}
                              onChange={(e) =>
                                updatePollAnswer(index, e.target.value)
                              }
                              placeholder={`Option ${index + 1}`}
                              disabled={isSpamming}
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removePollAnswer(index)}
                              disabled={pollAnswers.length <= 1 || isSpamming}
                              className="h-10 w-10"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addPollAnswer}
                          disabled={pollAnswers.length >= 10 || isSpamming}
                          className="w-full"
                        >
                          <Plus className="size-4 mr-2" /> Add Answer
                        </Button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="poll-multiselect"
                            checked={pollAllowMultiselect}
                            onCheckedChange={setPollAllowMultiselect}
                            disabled={isSpamming}
                          />
                          <Label htmlFor="poll-multiselect">
                            Allow Multiple Answers
                          </Label>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duration</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={isSpamming}>
                              <Button
                                variant="outline"
                                className="w-35 h-8 justify-between"
                                disabled={isSpamming}
                              >
                                {pollDuration === 1
                                  ? "1 Hour"
                                  : pollDuration === 4
                                    ? "4 Hours"
                                    : pollDuration === 8
                                      ? "8 Hours"
                                      : pollDuration === 24
                                        ? "24 Hours"
                                        : pollDuration === 72
                                          ? "3 Days"
                                          : "1 Week"}
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuRadioGroup
                                value={pollDuration.toString()}
                                onValueChange={(val) =>
                                  setPollDuration(parseInt(val))
                                }
                              >
                                <DropdownMenuRadioItem value="1">
                                  1 Hour
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="4">
                                  4 Hours
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="8">
                                  8 Hours
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="24">
                                  24 Hours
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="72">
                                  3 Days
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="168">
                                  1 Week
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  )}

                  {useEmbed && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 overflow-x-auto pb-2 max-w-[calc(100%-100px)]">
                          {embeds.map((_, index) => (
                            <Button
                              key={index}
                              variant={
                                activeEmbedIndex === index
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setActiveEmbedIndex(index)}
                              className="whitespace-nowrap"
                            >
                              Embed {index + 1}
                            </Button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeEmbed(activeEmbedIndex)}
                            disabled={embeds.length <= 1 || isSpamming}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={addEmbed}
                            disabled={embeds.length >= 10 || isSpamming}
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="embed-title">Embed Title</Label>
                        <Input
                          id="embed-title"
                          placeholder="Embed Title"
                          value={embeds[activeEmbedIndex].title}
                          onChange={(e) =>
                            updateEmbed(
                              activeEmbedIndex,
                              "title",
                              e.target.value,
                            )
                          }
                          disabled={isSpamming}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="embed-description">
                          Embed Description
                        </Label>
                        <Textarea
                          id="embed-description"
                          placeholder="Embed description..."
                          className="min-h-25"
                          value={embeds[activeEmbedIndex].description}
                          onChange={(e) =>
                            updateEmbed(
                              activeEmbedIndex,
                              "description",
                              e.target.value,
                            )
                          }
                          disabled={isSpamming}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="embed-color">Embed Color</Label>
                        <ColorPicker
                          color={embeds[activeEmbedIndex].color}
                          onChange={(color) =>
                            updateEmbed(activeEmbedIndex, "color", color)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="embed-author">Author Name</Label>
                          <Input
                            id="embed-author"
                            placeholder="Author name"
                            value={embeds[activeEmbedIndex].author}
                            onChange={(e) =>
                              updateEmbed(
                                activeEmbedIndex,
                                "author",
                                e.target.value,
                              )
                            }
                            disabled={isSpamming}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="embed-author-icon">
                            Author Icon URL
                          </Label>
                          <Input
                            id="embed-author-icon"
                            placeholder="https://example.com/icon.png"
                            value={embeds[activeEmbedIndex].authorIcon}
                            onChange={(e) =>
                              updateEmbed(
                                activeEmbedIndex,
                                "authorIcon",
                                e.target.value,
                              )
                            }
                            disabled={isSpamming}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="embed-footer">Footer Text</Label>
                          <Input
                            id="embed-footer"
                            placeholder="Footer text"
                            value={embeds[activeEmbedIndex].footer}
                            onChange={(e) =>
                              updateEmbed(
                                activeEmbedIndex,
                                "footer",
                                e.target.value,
                              )
                            }
                            disabled={isSpamming}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="embed-footer-icon">
                            Footer Icon URL
                          </Label>
                          <Input
                            id="embed-footer-icon"
                            placeholder="https://example.com/icon.png"
                            value={embeds[activeEmbedIndex].footerIcon}
                            onChange={(e) =>
                              updateEmbed(
                                activeEmbedIndex,
                                "footerIcon",
                                e.target.value,
                              )
                            }
                            disabled={isSpamming}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="embed-thumbnail">Thumbnail URL</Label>
                          <Input
                            id="embed-thumbnail"
                            placeholder="https://example.com/thumbnail.png"
                            value={embeds[activeEmbedIndex].thumbnail}
                            onChange={(e) =>
                              updateEmbed(
                                activeEmbedIndex,
                                "thumbnail",
                                e.target.value,
                              )
                            }
                            disabled={isSpamming}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="embed-image">Image URL</Label>
                          <Input
                            id="embed-image"
                            placeholder="https://example.com/image.png"
                            value={embeds[activeEmbedIndex].image}
                            onChange={(e) =>
                              updateEmbed(
                                activeEmbedIndex,
                                "image",
                                e.target.value,
                              )
                            }
                            disabled={isSpamming}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="embed-timestamp"
                          checked={!!embeds[activeEmbedIndex].timestamp}
                          onCheckedChange={(checked) =>
                            updateEmbed(
                              activeEmbedIndex,
                              "timestamp",
                              checked ? new Date().toISOString() : undefined,
                            )
                          }
                          disabled={isSpamming}
                        />
                        <Label htmlFor="embed-timestamp">
                          Include Timestamp
                        </Label>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Fields (Max 25)</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addField(activeEmbedIndex)}
                            disabled={
                              embeds[activeEmbedIndex].fields.length >= 25 ||
                              isSpamming
                            }
                          >
                            <Plus className="size-4 mr-1" /> Add Field
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {embeds[activeEmbedIndex].fields.map(
                            (field, index) => (
                              <div
                                key={index}
                                className="border rounded-md p-3 space-y-3 relative"
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-6 w-6"
                                  onClick={() =>
                                    removeField(activeEmbedIndex, index)
                                  }
                                  disabled={isSpamming}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`field-name-${index}`}
                                      className="text-xs"
                                    >
                                      Name
                                    </Label>
                                    <Input
                                      id={`field-name-${index}`}
                                      placeholder="Field Name"
                                      value={field.name}
                                      onChange={(e) =>
                                        updateField(
                                          activeEmbedIndex,
                                          index,
                                          "name",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isSpamming}
                                      className="h-8"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`field-value-${index}`}
                                      className="text-xs"
                                    >
                                      Value
                                    </Label>
                                    <Input
                                      id={`field-value-${index}`}
                                      placeholder="Field Value"
                                      value={field.value}
                                      onChange={(e) =>
                                        updateField(
                                          activeEmbedIndex,
                                          index,
                                          "value",
                                          e.target.value,
                                        )
                                      }
                                      disabled={isSpamming}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`field-inline-${index}`}
                                    checked={field.inline}
                                    onCheckedChange={(checked) =>
                                      updateField(
                                        activeEmbedIndex,
                                        index,
                                        "inline",
                                        checked,
                                      )
                                    }
                                    disabled={isSpamming}
                                  />
                                  <Label
                                    htmlFor={`field-inline-${index}`}
                                    className="text-xs"
                                  >
                                    Inline
                                  </Label>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={clearForm}
                    disabled={isSpamming}
                  >
                    Clear
                  </Button>
                  {useSpam ? (
                    isSpamming ? (
                      <Button variant="destructive" onClick={stopSpam}>
                        <CircleStop className="size-4" />
                        Stop Spam
                      </Button>
                    ) : (
                      <Button
                        onClick={startSpam}
                        disabled={loading || !webhookUrl || !content}
                      >
                        <Play className="size-4" />
                        Start Spam
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={sendWebhook}
                      disabled={loading || !webhookUrl || !content}
                    >
                      <Send className="size-4" />
                      {loading ? "Sending..." : "Send Webhook"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    How your message will appear in Discord
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#36393f] text-white rounded-md p-4 min-h-75">
                    {username && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                          {avatarUrl ? (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={avatarUrl} alt="Avatar" />
                              <AvatarFallback>
                                {username
                                  ? username.charAt(0).toUpperCase()
                                  : "D"}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <span className="text-white text-xs font-bold">
                              {username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold">{username}</span>
                      </div>
                    )}

                    {content && (
                      <p className="mb-2 wrap-break-words">{content}</p>
                    )}

                    {useEmbed && (
                      <div className="space-y-4">
                        {embeds.map((embed, index) => (
                          <EmbedPreview
                            key={index}
                            title={embed.title}
                            description={embed.description}
                            color={embed.color}
                            author={embed.author}
                            authorIcon={embed.authorIcon}
                            footer={embed.footer}
                            footerIcon={embed.footerIcon}
                            thumbnail={embed.thumbnail}
                            image={embed.image}
                            fields={embed.fields}
                            timestamp={embed.timestamp}
                            url={embed.url}
                          />
                        ))}
                      </div>
                    )}

                    {usePoll && (
                      <PollPreview
                        question={pollQuestion}
                        answers={pollAnswers}
                        allowMultiselect={pollAllowMultiselect}
                        duration={pollDuration}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Webhook</CardTitle>
              <CardDescription>
                Modify the webhook&apos;s settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    disabled={isSpamming}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Edit Username</Label>
                  <Input
                    id="username"
                    placeholder="Custom Bot Name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSpamming}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar-url">Avatar URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatar-url"
                      placeholder="https://example.com/avatar.png"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      disabled={isSpamming}
                    />
                    <Avatar>
                      <AvatarImage src={avatarUrl} alt="Avatar" />
                      <AvatarFallback>
                        {username ? username.charAt(0).toUpperCase() : "D"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={editWebhook}
                disabled={loading || !webhookUrl || (!username && !avatarUrl)}
                className="md:w-min w-full"
              >
                <Save className="size-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Webhooks</CardTitle>
              <CardDescription>
                Manage your saved Discord webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-name">Webhook Name</Label>
                  <Input
                    id="webhook-name"
                    placeholder="My Server Webhook"
                    value={webhookName}
                    onChange={(e) => setWebhookName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url-save">Webhook URL</Label>
                  <Input
                    id="webhook-url-save"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={saveWebhook} className="w-full">
                <Save className="size-4" />
                Save Webhook
              </Button>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Your Saved Webhooks</h3>
                {savedWebhooks.length === 0 ? (
                  <p className="text-muted-foreground">
                    No webhooks saved yet. Add one above.
                  </p>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {savedWebhooks.map((webhook, index) => (
                        <Card key={index}>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{webhook.name}</h4>
                                <p className="text-sm text-muted-foreground truncate max-w-75">
                                  {webhook.url}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    navigator.clipboard.writeText(webhook.url);
                                    toast.info("Copied", {
                                      description:
                                        "Webhook URL copied to clipboard",
                                    });
                                  }}
                                >
                                  <Copy className="size-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setWebhookUrl(webhook.url);
                                    setActiveTab("message");
                                  }}
                                >
                                  <Check className="size-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => deleteWebhook(index)}
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <WebhookHistory history={history} />
        </TabsContent>
      </Tabs>
      <footer className="mt-8 text-right flex justify-end gap-2">
        <Link
          target="_blank"
          href="https://discord.com/servers/uncover-it-1298592315694387220"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <Image
            src={discord}
            alt="Discord"
            width="19"
            height="19"
            className="dark:brightness-100 brightness-0"
          />
        </Link>
        <Link
          target="_blank"
          href="https://github.com/Uncover-it/webhook-multitool"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <Image
            src={github}
            alt="GitHub"
            width="19"
            height="19"
            className="dark:brightness-100 brightness-0"
          />
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            theme === "light" ? setTheme("dark") : setTheme("light")
          }
        >
          <Sun className="dark:hidden block" />
          <MoonStar className="dark:block hidden" />
        </Button>
      </footer>
    </div>
  );
}
