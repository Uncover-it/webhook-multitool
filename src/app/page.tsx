"use client";

import {
  Check,
  ChevronDown,
  CircleStop,
  Copy,
  Paperclip,
  Play,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Actions,
  Empty,
  Field,
  mono,
  PageIntro,
  Panel,
  Section,
  ToolTabs,
  TriggerLabel,
} from "@/components/kit";
import { PayloadTools } from "@/components/payload-tools";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DiscordPreview } from "@/components/webhook/discord-preview";
import { EmbedEditor } from "@/components/webhook/embed-editor";
import { PollEditor } from "@/components/webhook/poll-editor";
import { WebhookHistory } from "@/components/webhook-history";
import { readJson, writeJson } from "@/lib/storage";
import {
  buildRequestInit,
  type EmbedField,
  type EmbedState,
  embedToState,
  FLAG_SILENT,
  FLAG_SUPPRESS_EMBEDS,
  makeEmbed,
  type MentionKind,
  messageUrl,
  parseMessageRef,
  readErrorMessage,
  readRetryAfter,
  sleep,
  stateToEmbed,
  type WebhookHistoryItem,
  type WebhookPayload,
} from "@/lib/webhook";

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

  const [embeds, setEmbeds] = useState<EmbedState[]>([makeEmbed()]);
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
  const [mentions, setMentions] = useState<MentionKind[]>(["users", "roles"]);
  const [editing, setEditing] = useState<{
    webhookUrl: string;
    messageId: string;
    threadId?: string;
  } | null>(null);
  const [messageRef, setMessageRef] = useState("");

  useEffect(() => {
    setSavedWebhooks(
      readJson<{ name: string; url: string }[]>("savedWebhooks", []),
    );
    setHistory(readJson<WebhookHistoryItem[]>("webhookHistory", []));
  }, []);

  useEffect(() => {
    const spamState = spamRef.current;
    return () => {
      spamState.stop = true;
    };
  }, []);

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
        throw new Error(await readErrorMessage(response));
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

  const buildPayload = (): WebhookPayload => {
    const payload: WebhookPayload = {};
    if (username) payload.username = username;
    if (avatarUrl) payload.avatar_url = avatarUrl;
    if (content) payload.content = content;

    let flags = 0;
    if (suppressEmbeds) flags |= FLAG_SUPPRESS_EMBEDS;
    if (silentMessage) flags |= FLAG_SILENT;
    if (flags > 0) payload.flags = flags;

    if (useEmbed) payload.embeds = embeds.map(stateToEmbed);

    if (usePoll) {
      if (!pollQuestion.trim())
        throw new Error("Poll question cannot be empty");
      if (pollAnswers.some((a) => !a.text.trim())) {
        throw new Error("All poll answers must have text");
      }
      if (pollAnswers.length < 2)
        throw new Error("Poll must have at least 2 answers");
      payload.poll = {
        question: { text: pollQuestion },
        answers: pollAnswers.map((a) => ({ poll_media: { text: a.text } })),
        allow_multiselect: pollAllowMultiselect,
        duration: pollDuration,
        layout_type: 1,
      };
    }

    payload.allowed_mentions = { parse: mentions };
    if (useTTS) payload.tts = true;
    return payload;
  };

  const previewPayload = (): WebhookPayload => {
    try {
      return buildPayload();
    } catch {
      return {
        content,
        embeds: useEmbed ? embeds.map(stateToEmbed) : undefined,
      };
    }
  };

  const applyPayload = (payload: WebhookPayload) => {
    setContent(payload.content ?? "");
    if (payload.username !== undefined) setUsername(payload.username);
    if (payload.avatar_url !== undefined) setAvatarUrl(payload.avatar_url);
    const loadedEmbeds = (payload.embeds ?? []).slice(0, 10).map(embedToState);
    setEmbeds(loadedEmbeds.length ? loadedEmbeds : [makeEmbed()]);
    setActiveEmbedIndex(0);
    setUseEmbed(loadedEmbeds.length > 0);
    setUsePoll(Boolean(payload.poll));
    if (payload.poll) {
      setPollQuestion(payload.poll.question?.text ?? "");
      setPollAnswers(
        (payload.poll.answers ?? []).map((a) => ({
          text: a.poll_media?.text ?? "",
        })),
      );
      setPollAllowMultiselect(Boolean(payload.poll.allow_multiselect));
      setPollDuration(payload.poll.duration ?? 24);
    }
    setUseTTS(Boolean(payload.tts));
    setSuppressEmbeds(Boolean((payload.flags ?? 0) & FLAG_SUPPRESS_EMBEDS));
    setSilentMessage(Boolean((payload.flags ?? 0) & FLAG_SILENT));
    if (payload.allowed_mentions?.parse)
      setMentions(payload.allowed_mentions.parse);
  };

  const saveHistory = (next: WebhookHistoryItem[]) => {
    setHistory(next);
    if (!writeJson("webhookHistory", next)) {
      toast.error("Could not save the history in this browser");
    }
  };

  const sendWebhook = async () => {
    setLoading(true);
    try {
      const payload = buildPayload();

      if (editing) {
        const {
          username: _u,
          avatar_url: _a,
          poll: _p,
          tts: _t,
          ...editable
        } = payload;
        const response = await fetch(
          messageUrl(editing.webhookUrl, editing.messageId, editing.threadId),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editable),
          },
        );
        if (!response.ok) throw new Error(await readErrorMessage(response));
        saveHistory(
          history.map((item) =>
            item.messageId === editing.messageId
              ? {
                  ...item,
                  payload: { ...item.payload, ...editable },
                  edited: true,
                }
              : item,
          ),
        );
        setEditing(null);
        toast.success("Message updated", {
          description: "The message in Discord now matches the composer.",
        });
        return;
      }

      const { body, headers } = buildRequestInit(payload, files);
      const url = new URL(webhookUrl);
      url.searchParams.set("wait", "true");
      if (threadId) url.searchParams.set("thread_id", threadId);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers,
        body,
      });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      const message: { id?: string; channel_id?: string } = await response
        .json()
        .catch(() => ({}));

      const historyItem: WebhookHistoryItem = {
        timestamp: new Date().toISOString(),
        payload,
        webhookUrl,
        messageId: message.id,
        channelId: message.channel_id,
        threadId: threadId || undefined,
      };
      saveHistory([historyItem, ...history].slice(0, 50));
      toast.success("Webhook sent", {
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      toast.error(
        editing ? "Error updating message" : "Error sending webhook",
        {
          description: error instanceof Error ? error.message : String(error),
        },
      );
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (item: WebhookHistoryItem) => {
    if (!item.messageId) return;
    setWebhookUrl(item.webhookUrl);
    setThreadId(item.threadId ?? "");
    applyPayload(item.payload);
    setFiles([]);
    setUseSpam(false);
    setEditing({
      webhookUrl: item.webhookUrl,
      messageId: item.messageId,
      threadId: item.threadId,
    });
    setActiveTab("message");
    toast.info("Editing a sent message", {
      description: "Change it in the composer, then press Update message.",
    });
  };

  const deleteMessage = async (item: WebhookHistoryItem) => {
    if (!item.messageId) return;
    try {
      const response = await fetch(
        messageUrl(item.webhookUrl, item.messageId, item.threadId),
        { method: "DELETE" },
      );
      if (!response.ok && response.status !== 404) {
        throw new Error(await readErrorMessage(response));
      }
      saveHistory(
        history.map((entry) =>
          entry.messageId === item.messageId
            ? { ...entry, deleted: true }
            : entry,
        ),
      );
      if (editing?.messageId === item.messageId) setEditing(null);
      toast.success("Message deleted", {
        description: "It has been removed from Discord.",
      });
    } catch (error) {
      toast.error("Could not delete the message", {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const loadMessage = async () => {
    const ref = parseMessageRef(messageRef);
    if (!ref) {
      toast.error("Paste a message ID or a message link");
      return;
    }
    if (!webhookUrl) {
      toast.error("Enter the webhook URL that sent the message");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        messageUrl(webhookUrl, ref.messageId, threadId || undefined),
      );
      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "No such message from this webhook. A webhook can only load messages it sent."
            : await readErrorMessage(response),
        );
      }
      const message: WebhookPayload & { id: string; channel_id: string } =
        await response.json();
      startEditing({
        timestamp: new Date().toISOString(),
        payload: {
          content: message.content,
          embeds: message.embeds,
          flags: message.flags,
        },
        webhookUrl,
        messageId: message.id,
        channelId: message.channel_id,
        threadId: threadId || undefined,
      });
      setMessageRef("");
    } catch (error) {
      toast.error("Could not load the message", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const startSpam = async () => {
    let payload: WebhookPayload;
    try {
      payload = buildPayload();
    } catch (error) {
      toast.error("Poll Error", {
        description: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    setIsSpamming(true);
    spamRef.current.stop = false;

    const spam = async () => {
      toast.info("Spamming started", {
        description: "Spamming the webhook.",
      });
      while (!spamRef.current.stop) {
        try {
          const url = new URL(webhookUrl);
          if (threadId) {
            url.searchParams.append("thread_id", threadId);
          }

          const { body, headers } = buildRequestInit(payload, files);

          const response = await fetch(url.toString(), {
            method: "POST",
            headers,
            body,
          });

          if (response.status === 429) {
            const retryAfter = await readRetryAfter(response);
            await sleep(retryAfter);
            continue;
          }

          if (!response.ok) {
            throw new Error(await readErrorMessage(response));
          }
        } catch (error) {
          toast.error("Error sending webhook", {
            description: error instanceof Error ? error.message : String(error),
          });
          spamRef.current.stop = true;
          setIsSpamming(false);
          return;
        }
      }
    };
    void spam();
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
    setEmbeds([makeEmbed()]);
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

  const updateEmbed = <K extends keyof EmbedState>(
    index: number,
    field: K,
    value: EmbedState[K],
  ) => {
    const newEmbeds = [...embeds];
    newEmbeds[index] = { ...newEmbeds[index], [field]: value };
    setEmbeds(newEmbeds);
  };

  const addField = (embedIndex: number) => {
    const embed = embeds[embedIndex];
    if (embed.fields.length < 25) {
      const newEmbeds = [...embeds];
      newEmbeds[embedIndex] = {
        ...embed,
        fields: [...embed.fields, { name: "", value: "", inline: false }],
      };
      setEmbeds(newEmbeds);
    }
  };

  const removeField = (embedIndex: number, fieldIndex: number) => {
    const embed = embeds[embedIndex];
    const newEmbeds = [...embeds];
    newEmbeds[embedIndex] = {
      ...embed,
      fields: embed.fields.filter((_, i) => i !== fieldIndex),
    };
    setEmbeds(newEmbeds);
  };

  const updateField = <K extends keyof EmbedField>(
    embedIndex: number,
    fieldIndex: number,
    key: K,
    value: EmbedField[K],
  ) => {
    const embed = embeds[embedIndex];
    const newEmbeds = [...embeds];
    newEmbeds[embedIndex] = {
      ...embed,
      fields: embed.fields.map((f, i) =>
        i === fieldIndex ? { ...f, [key]: value } : f,
      ),
    };
    setEmbeds(newEmbeds);
  };

  const addEmbed = () => {
    if (embeds.length < 10) {
      setEmbeds([...embeds, makeEmbed()]);
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
    setPollAnswers(
      pollAnswers.map((answer, i) =>
        i === index ? { ...answer, text } : answer,
      ),
    );
  };

  const deleteRemoteWebhook = async () => {
    if (!webhookUrl) return;
    try {
      const response = await fetch(webhookUrl, { method: "DELETE" });
      if (!response.ok) throw new Error(await readErrorMessage(response));
      setWebhookUrl("");
      toast.success("Webhook deleted", {
        description: "The webhook has been deleted from Discord.",
      });
    } catch (error) {
      toast.error("Failed to delete webhook", {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const webhookId = /\/webhooks\/(\d+)\//.exec(webhookUrl)?.[1];
  const hasMessage = Boolean(
    content || useEmbed || usePoll || files.length > 0,
  );
  const optionNotes = [
    useTTS && "TTS",
    silentMessage && "silent",
    suppressEmbeds && "no link embeds",
    !mentions.includes("everyone") && "no @everyone",
    useSpam && "spam",
  ].filter(Boolean);

  const webhookField = (
    <Field label="Webhook URL" htmlFor="webhook-url">
      <div className="flex gap-2">
        <Input
          id="webhook-url"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://discord.com/api/webhooks/…"
          className="font-mono text-sm"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value.trim())}
          disabled={isSpamming}
        />
        {savedWebhooks.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={mono} disabled={isSpamming}>
                Saved
                <ChevronDown />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-1">
              <ul className="max-h-72 overflow-auto">
                {savedWebhooks.map((webhook) => (
                  <li key={webhook.url}>
                    <button
                      type="button"
                      className="w-full cursor-pointer truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                      onClick={() => selectWebhook(webhook.url)}
                    >
                      {webhook.name}
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </Field>
  );

  return (
    <div className="relative mx-auto max-w-5xl px-6 pb-16 xl:px-1">
      <PageIntro
        title="Webhook Multitool"
        github="https://github.com/Uncover-it/webhook-multitool"
        info={
          webhookId ? (
            <>
              Webhook: <span className="font-mono">{webhookId}</span>
            </>
          ) : (
            "Send, edit and delete Discord webhook messages."
          )
        }
      />

      <ToolTabs
        className="mt-8"
        value={activeTab}
        onChange={setActiveTab}
        disabled={(tab) => isSpamming && tab !== "message"}
        tabs={[
          { value: "message", label: "Message" },
          { value: "edit", label: "Edit" },
          { value: "webhooks", label: "Webhooks", count: savedWebhooks.length },
          { value: "history", label: "History", count: history.length },
        ]}
      />

      {activeTab === "message" && (
        <>
          <Section
            title="Message"
            description={
              editing
                ? "Editing a message that was already sent"
                : "Compose the message and who it comes from"
            }
            actions={
              editing && (
                <Button
                  variant="outline"
                  size="sm"
                  className={mono}
                  onClick={() => setEditing(null)}
                >
                  <X />
                  Stop editing
                </Button>
              )
            }
          >
            {editing && (
              <Panel className="text-muted-foreground">
                Changing message{" "}
                <span className="font-mono text-foreground">
                  {editing.messageId}
                </span>
                . Its text, embeds and mentions can change; the sender, poll and
                files can&apos;t.
              </Panel>
            )}
            <Panel className="space-y-4">
              {webhookField}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Username" htmlFor="username">
                  <Input
                    id="username"
                    placeholder="Webhook's own name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSpamming || editing !== null}
                  />
                </Field>
                <Field label="Avatar URL" htmlFor="avatar-url">
                  <Input
                    id="avatar-url"
                    placeholder="https://example.com/avatar.png"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    disabled={isSpamming || editing !== null}
                  />
                </Field>
                <Field label="Thread ID" htmlFor="thread-id">
                  <Input
                    id="thread-id"
                    placeholder="Only for threads"
                    className="font-mono text-sm"
                    value={threadId}
                    onChange={(e) => setThreadId(e.target.value.trim())}
                    disabled={isSpamming}
                  />
                </Field>
              </div>
            </Panel>

            <Panel>
              <Field
                label="Content"
                htmlFor="content"
                aside={
                  <span
                    className={
                      content.length > 2000 ? "text-destructive" : undefined
                    }
                  >
                    {content.length}/2000
                  </span>
                }
              >
                <Textarea
                  id="content"
                  placeholder="Markdown works: **bold**, *italic*, `code`, ||spoiler||, <t:1700000000:R>"
                  className="min-h-28 font-mono text-sm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSpamming}
                />
              </Field>

              <Accordion type="multiple" className="mt-2">
                <AccordionItem value="files">
                  <AccordionTrigger className="py-2 text-lg font-semibold">
                    <TriggerLabel title="Attachments" count={files.length} />
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {files.map((file, index) => (
                          <span
                            key={file.name + file.size}
                            className="inline-flex max-w-full items-center gap-1 rounded-md border bg-background/10 py-0.5 pr-0.5 pl-2 font-mono text-xs shadow-inner"
                          >
                            <span className="truncate">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-6"
                              aria-label={`Remove ${file.name}`}
                              onClick={() =>
                                setFiles(files.filter((_, i) => i !== index))
                              }
                            >
                              <X />
                            </Button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={mono}
                        onClick={() =>
                          document.getElementById("file-upload")?.click()
                        }
                        disabled={
                          isSpamming || editing !== null || files.length >= 10
                        }
                      >
                        <Paperclip />
                        Add files
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Up to 10 files, 25 MB in total
                      </span>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            const added = Array.from(e.target.files);
                            if (files.length + added.length > 10) {
                              toast.error("Limit Exceeded", {
                                description:
                                  "You can only attach up to 10 files.",
                              });
                            } else {
                              setFiles([...files, ...added]);
                            }
                          }
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="embeds">
                  <AccordionTrigger className="py-2 text-lg font-semibold">
                    <TriggerLabel
                      title="Embeds"
                      count={useEmbed ? embeds.length : undefined}
                      note={useEmbed ? undefined : "off"}
                    />
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="use-embed"
                        checked={useEmbed}
                        onCheckedChange={setUseEmbed}
                        disabled={isSpamming}
                      />
                      <label htmlFor="use-embed">
                        Send embeds with this message
                      </label>
                    </div>
                    {useEmbed && (
                      <EmbedEditor
                        embeds={embeds}
                        active={activeEmbedIndex}
                        onActive={setActiveEmbedIndex}
                        onAdd={addEmbed}
                        onRemove={removeEmbed}
                        onChange={updateEmbed}
                        onAddField={addField}
                        onRemoveField={removeField}
                        onChangeField={updateField}
                        disabled={isSpamming}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="poll">
                  <AccordionTrigger className="py-2 text-lg font-semibold">
                    <TriggerLabel
                      title="Poll"
                      note={usePoll ? `${pollAnswers.length} answers` : "off"}
                    />
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="use-poll"
                        checked={usePoll}
                        onCheckedChange={setUsePoll}
                        disabled={isSpamming || editing !== null}
                      />
                      <label htmlFor="use-poll">Attach a poll</label>
                    </div>
                    {usePoll && (
                      <PollEditor
                        question={pollQuestion}
                        onQuestion={setPollQuestion}
                        answers={pollAnswers}
                        onAnswer={updatePollAnswer}
                        onAddAnswer={addPollAnswer}
                        onRemoveAnswer={removePollAnswer}
                        multiselect={pollAllowMultiselect}
                        onMultiselect={setPollAllowMultiselect}
                        duration={pollDuration}
                        onDuration={setPollDuration}
                        disabled={isSpamming}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="options">
                  <AccordionTrigger className="py-2 text-lg font-semibold">
                    <TriggerLabel
                      title="Options"
                      note={optionNotes.join(" · ")}
                    />
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(
                        [
                          [
                            "use-tts",
                            "Read aloud (TTS)",
                            useTTS,
                            setUseTTS,
                            editing !== null,
                          ],
                          [
                            "silent-message",
                            "Silent, no notification",
                            silentMessage,
                            setSilentMessage,
                            false,
                          ],
                          [
                            "suppress-embeds",
                            "Hide link embeds",
                            suppressEmbeds,
                            setSuppressEmbeds,
                            useEmbed,
                          ],
                          [
                            "spam",
                            "Spam until stopped",
                            useSpam,
                            setUseSpam,
                            editing !== null,
                          ],
                        ] as const
                      ).map(([id, label, checked, set, off]) => (
                        <div key={id} className="flex items-center gap-2">
                          <Switch
                            id={id}
                            checked={checked}
                            onCheckedChange={set}
                            disabled={isSpamming || off}
                          />
                          <label htmlFor={id}>{label}</label>
                        </div>
                      ))}
                    </div>
                    <Field
                      label="Mentions that ping"
                      hint="Mentions that are switched off still show in the message, they just don't notify anyone."
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            ["users", "Users"],
                            ["roles", "Roles"],
                            ["everyone", "@everyone & @here"],
                          ] as const
                        ).map(([kind, label]) => {
                          const on = mentions.includes(kind);
                          return (
                            <button
                              key={kind}
                              type="button"
                              aria-pressed={on}
                              disabled={isSpamming}
                              onClick={() =>
                                setMentions(
                                  on
                                    ? mentions.filter((m) => m !== kind)
                                    : [...mentions, kind],
                                )
                              }
                              className={`h-7 cursor-pointer rounded-md border px-2.5 font-mono text-xs tracking-tight disabled:pointer-events-none disabled:opacity-50 ${
                                on
                                  ? kind === "everyone"
                                    ? "border-destructive bg-destructive text-white"
                                    : "border-foreground bg-foreground text-background"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Panel>

            <Actions>
              <Button
                variant="outline"
                size="sm"
                className={mono}
                onClick={clearForm}
                disabled={isSpamming}
              >
                Clear
              </Button>
              <PayloadTools
                payload={previewPayload()}
                onImport={(payload) => {
                  applyPayload(payload);
                  setActiveTab("message");
                }}
              />
              {useSpam && !editing ? (
                isSpamming ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    className={mono}
                    onClick={stopSpam}
                  >
                    <CircleStop />
                    Stop spam
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className={mono}
                    onClick={startSpam}
                    disabled={loading || !webhookUrl || !hasMessage}
                  >
                    <Play />
                    Start spam
                  </Button>
                )
              ) : (
                <Button
                  size="sm"
                  className={mono}
                  onClick={sendWebhook}
                  disabled={loading || !webhookUrl || !hasMessage}
                >
                  <Send />
                  {editing
                    ? loading
                      ? "Updating…"
                      : "Update message"
                    : loading
                      ? "Sending…"
                      : "Send"}
                </Button>
              )}
            </Actions>
          </Section>

          <Section
            title="Preview"
            description="How the message will look in Discord"
          >
            <DiscordPreview
              username={username}
              avatarUrl={avatarUrl}
              content={content}
              files={files}
              embeds={useEmbed ? embeds : []}
              poll={
                usePoll
                  ? {
                      question: pollQuestion,
                      answers: pollAnswers,
                      allowMultiselect: pollAllowMultiselect,
                      duration: pollDuration,
                    }
                  : undefined
              }
            />
          </Section>
        </>
      )}

      {activeTab === "edit" && (
        <>
          <Section
            title="Webhook"
            description="Rename the webhook, change its picture, or delete it"
          >
            <Panel className="space-y-4">
              {webhookField}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="New name" htmlFor="edit-username">
                  <Input
                    id="edit-username"
                    placeholder="Leave empty to keep it"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSpamming}
                  />
                </Field>
                <Field label="New avatar URL" htmlFor="edit-avatar">
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-avatar"
                      placeholder="https://example.com/avatar.png"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      disabled={isSpamming}
                    />
                    <Avatar className="size-9 shrink-0">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                      <AvatarFallback>
                        {(username || "W").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </Field>
              </div>
            </Panel>
            <Actions>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={mono}
                    disabled={!webhookUrl}
                  >
                    <Trash2 />
                    Delete webhook
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete this webhook?</DialogTitle>
                    <DialogDescription>
                      This removes the webhook from Discord for good. Nothing
                      can be sent through it afterwards, and it can&apos;t be
                      undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" size="sm" className={mono}>
                        Keep it
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className={mono}
                        onClick={deleteRemoteWebhook}
                      >
                        Delete
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                className={mono}
                onClick={editWebhook}
                disabled={loading || !webhookUrl || (!username && !avatarUrl)}
              >
                <Save />
                {loading ? "Saving…" : "Save changes"}
              </Button>
            </Actions>
          </Section>

          <Section
            title="Sent message"
            description="Load a message this webhook sent, by ID or message link, to change it"
          >
            <Panel>
              <Field
                label="Message ID or link"
                htmlFor="message-ref"
                hint="Right-click the message in Discord, then Copy Message Link. Fill in the thread ID on the Message tab if it is in a thread."
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="message-ref"
                    placeholder="https://discord.com/channels/…/…/…"
                    className="font-mono text-sm"
                    value={messageRef}
                    onChange={(e) => setMessageRef(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadMessage()}
                  />
                  <Button
                    variant="outline"
                    className={mono}
                    onClick={loadMessage}
                    disabled={loading || !messageRef.trim() || !webhookUrl}
                  >
                    Load message
                  </Button>
                </div>
              </Field>
            </Panel>
          </Section>
        </>
      )}

      {activeTab === "webhooks" && (
        <Section title="Saved webhooks" description="Kept in this browser only">
          <Panel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
              <Field label="Name" htmlFor="webhook-name">
                <Input
                  id="webhook-name"
                  placeholder="My server"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                />
              </Field>
              <Field label="Webhook URL" htmlFor="webhook-url-save">
                <Input
                  id="webhook-url-save"
                  type="password"
                  autoComplete="off"
                  placeholder="https://discord.com/api/webhooks/…"
                  className="font-mono text-sm"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value.trim())}
                />
              </Field>
              <Button className={mono} onClick={saveWebhook}>
                <Save />
                Save
              </Button>
            </div>
          </Panel>
          {savedWebhooks.length === 0 ? (
            <div className="my-2">
              <Empty>No saved webhooks yet.</Empty>
            </div>
          ) : (
            <Panel className="p-2">
              <ul>
                {savedWebhooks.map((webhook, index) => (
                  <li
                    key={webhook.url}
                    className="flex flex-wrap items-center gap-2 border-b border-dashed border-border/60 px-2 py-2 last:border-b-0 dark:border-border/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{webhook.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {/\/webhooks\/(\d+)\//.exec(webhook.url)?.[1] ??
                          "webhook"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={mono}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(webhook.url);
                          toast.success("Copied to clipboard!");
                        } catch {
                          toast.error("Could not copy to clipboard");
                        }
                      }}
                    >
                      <Copy />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={mono}
                      onClick={() => {
                        setWebhookUrl(webhook.url);
                        setActiveTab("message");
                      }}
                    >
                      <Check />
                      Use
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${webhook.name}`}
                      onClick={() => deleteWebhook(index)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </Section>
      )}

      {activeTab === "history" && (
        <WebhookHistory
          history={history}
          setHistory={saveHistory}
          onEdit={startEditing}
          onDelete={deleteMessage}
        />
      )}
    </div>
  );
}
