"use client";

import { Paperclip } from "lucide-react";
import { DiscordMarkdown } from "@/components/discord-markdown";
import { EmbedPreview } from "@/components/embed-preview";
import { PollPreview } from "@/components/poll-preview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { EmbedState } from "@/lib/webhook";

/** The message as Discord's dark theme would draw it. */
export function DiscordPreview({
  username,
  avatarUrl,
  content,
  files,
  embeds,
  poll,
}: {
  username: string;
  avatarUrl: string;
  content: string;
  files: File[];
  embeds: EmbedState[];
  poll?: {
    question: string;
    answers: { text: string }[];
    allowMultiselect: boolean;
    duration: number;
  };
}) {
  const empty = !content && files.length === 0 && embeds.length === 0 && !poll;

  return (
    <div className="my-2 rounded-xl border border-border/40 bg-[#313338] p-4 text-[15px] leading-[1.375] text-[#dbdee1]">
      {empty ? (
        <p className="py-8 text-center text-sm text-[#949ba4]">
          Write something and it shows up here.
        </p>
      ) : (
        <div className="flex gap-4">
          <Avatar className="mt-0.5 size-10 shrink-0">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback className="bg-[#5865f2] text-sm font-semibold text-white">
              {(username || "Webhook").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <span className="font-medium text-white">
                {username || "Webhook"}
              </span>
              <span className="rounded-[3px] bg-[#5865f2] px-1 text-[10px] leading-4 font-semibold text-white">
                APP
              </span>
              <span className="text-xs text-[#949ba4]">
                Today at{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {content && <DiscordMarkdown text={content} />}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <span
                    key={file.name + file.size}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#1e1f22] bg-[#2b2d31] px-2 py-1 text-xs"
                  >
                    <Paperclip className="size-3 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </span>
                ))}
              </div>
            )}
            {embeds.map((embed, index) => (
              <EmbedPreview key={index} {...embed} />
            ))}
            {poll && (
              <PollPreview
                question={poll.question}
                answers={poll.answers}
                allowMultiselect={poll.allowMultiselect}
                duration={poll.duration}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
