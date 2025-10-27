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
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ColorPicker } from "@/components/color-picker";
import { WebhookHistory } from "@/components/webhook-history";
import { EmbedPreview } from "@/components/embed-preview";
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
import github from "@/../public/github.svg"
import discord from "@/../public/discord.svg"

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
  const [content, setContent] = useState("");
  const [embedTitle, setEmbedTitle] = useState("");
  const [embedDescription, setEmbedDescription] = useState("");
  const [embedColor, setEmbedColor] = useState("#5865F2");
  const [embedAuthor, setEmbedAuthor] = useState("");
  const [embedAuthorIcon, setEmbedAuthorIcon] = useState("");
  const [embedFooter, setEmbedFooter] = useState("");
  const [embedFooterIcon, setEmbedFooterIcon] = useState("");
  const [embedThumbnail, setEmbedThumbnail] = useState("");
  const [embedImage, setEmbedImage] = useState("");
  const [useEmbed, setUseEmbed] = useState(false);
  const [useTTS, setUseTTS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<WebhookHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("message");
  const [isSpamming, setIsSpamming] = useState(false);
  const [useSpam, setUseSpam] = useState(false);
  const spamRef = useRef<{ stop: boolean }>({ stop: false });

  const isValidWebhook = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

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
    if (!isValidWebhook(webhookUrl)) {
      toast.error("Error", {
        description: "Please enter a valid webhook URL",
      });
      return;
    }

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
    if (!isValidWebhook(webhookUrl)) {
      toast.error("Error", {
        description: "Please enter a valid webhook URL",
      });
      return;
    }

    setLoading(true);

    try {
      const payload: WebhookPayload = {};

      if (username) payload.username = username;
      if (avatarUrl) payload.avatar_url = avatarUrl;
      if (content) payload.content = content;

      if (useEmbed) {
        const embed: WebhookEmbed = {};
        if (embedTitle) embed.title = embedTitle;
        if (embedDescription) embed.description = embedDescription;
        if (embedColor)
          embed.color = Number.parseInt(embedColor.replace("#", ""), 16);

        if (embedAuthor) {
          embed.author = { name: embedAuthor };
          if (embedAuthorIcon) embed.author.icon_url = embedAuthorIcon;
        }

        if (embedFooter) {
          embed.footer = { text: embedFooter };
          if (embedFooterIcon) embed.footer.icon_url = embedFooterIcon;
        }

        if (embedThumbnail) embed.thumbnail = { url: embedThumbnail };
        if (embedImage) embed.image = { url: embedImage };

        payload.embeds = [embed];
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(useTTS ? { ...payload, tts: true } : payload),
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
    if (!isValidWebhook(webhookUrl)) {
      toast.error("Error", {
        description: "Please enter a valid webhook URL",
      });
      return;
    }

    setIsSpamming(true);
    spamRef.current.stop = false;
    const payload: WebhookPayload = {};
    if (username) payload.username = username;
    if (avatarUrl) payload.avatar_url = avatarUrl;
    if (content) payload.content = content;
    if (useEmbed) {
      const embed: WebhookEmbed = {};
      if (embedTitle) embed.title = embedTitle;
      if (embedDescription) embed.description = embedDescription;
      if (embedColor)
        embed.color = Number.parseInt(embedColor.replace("#", ""), 16);
      if (embedAuthor) {
        embed.author = { name: embedAuthor };
        if (embedAuthorIcon) embed.author.icon_url = embedAuthorIcon;
      }
      if (embedFooter) {
        embed.footer = { text: embedFooter };
        if (embedFooterIcon) embed.footer.icon_url = embedFooterIcon;
      }
      if (embedThumbnail) embed.thumbnail = { url: embedThumbnail };
      if (embedImage) embed.image = { url: embedImage };
      payload.embeds = [embed];
    }
    const spam = async () => {
      toast.info("Spamming started", {
        description: "Spamming the webhook.",
      });
      while (!spamRef.current.stop) {
        let response: Response | undefined;
        try {
          response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(useTTS ? { ...payload, tts: true } : payload),
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
    setEmbedTitle("");
    setEmbedDescription("");
    setEmbedColor("#5865F2");
    setEmbedAuthor("");
    setEmbedAuthorIcon("");
    setEmbedFooter("");
    setEmbedFooterIcon("");
    setEmbedThumbnail("");
    setEmbedImage("");
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
                          <div className="max-h-[300px] overflow-auto">
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
                      className="min-h-[100px]"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={isSpamming}
                    />
                  </div>

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
                      id="use-tts"
                      checked={useTTS}
                      onCheckedChange={setUseTTS}
                      disabled={isSpamming}
                    />
                    <Label htmlFor="use-tts">TTS</Label>
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

                  {useEmbed && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="embed-title">Embed Title</Label>
                        <Input
                          id="embed-title"
                          placeholder="Embed Title"
                          value={embedTitle}
                          onChange={(e) => setEmbedTitle(e.target.value)}
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
                          className="min-h-[100px]"
                          value={embedDescription}
                          onChange={(e) => setEmbedDescription(e.target.value)}
                          disabled={isSpamming}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="embed-color">Embed Color</Label>
                        <ColorPicker
                          color={embedColor}
                          onChange={setEmbedColor}
                        />
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="embed-author">Author Name</Label>
                          <Input
                            id="embed-author"
                            placeholder="Author name"
                            value={embedAuthor}
                            onChange={(e) => setEmbedAuthor(e.target.value)}
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
                            value={embedAuthorIcon}
                            onChange={(e) => setEmbedAuthorIcon(e.target.value)}
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
                            value={embedFooter}
                            onChange={(e) => setEmbedFooter(e.target.value)}
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
                            value={embedFooterIcon}
                            onChange={(e) => setEmbedFooterIcon(e.target.value)}
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
                            value={embedThumbnail}
                            onChange={(e) => setEmbedThumbnail(e.target.value)}
                            disabled={isSpamming}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="embed-image">Image URL</Label>
                          <Input
                            id="embed-image"
                            placeholder="https://example.com/image.png"
                            value={embedImage}
                            onChange={(e) => setEmbedImage(e.target.value)}
                            disabled={isSpamming}
                          />
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
                  <div className="bg-[#36393f] text-white rounded-md p-4 min-h-[300px]">
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

                    {content && <p className="mb-2 break-words">{content}</p>}

                    {useEmbed && (
                      <EmbedPreview
                        title={embedTitle}
                        description={embedDescription}
                        color={embedColor}
                        author={embedAuthor}
                        authorIcon={embedAuthorIcon}
                        footer={embedFooter}
                        footerIcon={embedFooterIcon}
                        thumbnail={embedThumbnail}
                        image={embedImage}
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
                                <p className="text-sm text-muted-foreground truncate max-w-[300px]">
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
