"use client";

import {
  Braces,
  Copy,
  Download,
  FolderOpen,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Empty, mono, ToolTabs } from "@/components/kit";
import { Textarea } from "@/components/ui/textarea";
import { readJson, writeJson } from "@/lib/storage";
import type { WebhookPayload } from "@/lib/webhook";

const TEMPLATES_KEY = "webhookTemplates";

interface Template {
  id: string;
  name: string;
  payload: WebhookPayload;
  savedAt: string;
}

export function parsePayload(text: string): WebhookPayload {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object.");
  }
  const record = parsed as Record<string, unknown>;
  const wrapped = (record.messages as { data?: unknown }[] | undefined)?.[0]
    ?.data;
  const payload = (wrapped ?? record) as Record<string, unknown>;

  if (
    payload.content !== undefined &&
    payload.content !== null &&
    typeof payload.content !== "string"
  ) {
    throw new Error('"content" must be a string.');
  }
  if (
    payload.embeds !== undefined &&
    payload.embeds !== null &&
    !Array.isArray(payload.embeds)
  ) {
    throw new Error('"embeds" must be a list.');
  }
  if (
    !payload.content &&
    !(payload.embeds as unknown[] | undefined)?.length &&
    !payload.poll
  ) {
    throw new Error("The JSON has no content, embeds or poll.");
  }
  return payload as WebhookPayload;
}

export function PayloadTools({
  payload,
  onImport,
}: {
  payload: WebhookPayload;
  onImport: (payload: WebhookPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [view, setView] = useState<"json" | "templates">("json");

  // Each time the dialog opens it shows the message as it is right now
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setJson(JSON.stringify(payload, null, 2));
      setError(null);
      setTemplates(readJson<Template[]>(TEMPLATES_KEY, []));
    }
    setOpen(next);
  };

  const saveTemplates = (next: Template[]) => {
    setTemplates(next);
    if (!writeJson(TEMPLATES_KEY, next))
      toast.error("Could not save to this browser's storage");
  };

  const importJson = () => {
    try {
      onImport(parsePayload(json));
      setOpen(false);
      toast.success("Message loaded from JSON");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "webhook-message.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const saveTemplate = () => {
    const name = templateName.trim();
    if (!name) {
      toast.error("Name the template first");
      return;
    }
    saveTemplates([
      {
        id: crypto.randomUUID(),
        name,
        payload,
        savedAt: new Date().toISOString(),
      },
      ...templates.filter((template) => template.name !== name),
    ]);
    setTemplateName("");
    toast.success("Template saved", {
      description: `"${name}" is in your templates.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={mono}>
          <Braces />
          JSON &amp; templates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>JSON &amp; templates</DialogTitle>
          <DialogDescription>
            Copy the message as JSON (it works in Discohook too), paste JSON to
            load a message, or keep it as a template in this browser.
          </DialogDescription>
        </DialogHeader>
        <ToolTabs
          value={view}
          onChange={setView}
          tabs={[
            { value: "json", label: "JSON" },
            { value: "templates", label: "Templates", count: templates.length },
          ]}
        />
        {view === "json" ? (
          <div className="space-y-3">
            <Textarea
              value={json}
              onChange={(event) => {
                setJson(event.target.value);
                setError(null);
              }}
              spellCheck={false}
              className="h-72 font-mono text-xs"
              aria-label="Message JSON"
              aria-invalid={error ? true : undefined}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className={mono}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(json);
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
                onClick={download}
              >
                <Download />
                Download
              </Button>
              <Button size="sm" className={mono} onClick={importJson}>
                <Upload />
                Load this JSON
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Template name"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && saveTemplate()}
              />
              <Button className={mono} onClick={saveTemplate}>
                <Save />
                Save current
              </Button>
            </div>
            {templates.length === 0 ? (
              <Empty>
                No templates yet. Saving one keeps the whole message, embeds and
                poll included, but not the webhook URL.
              </Empty>
            ) : (
              <ul className="max-h-72 overflow-y-auto rounded-xl border border-border/40 bg-accent p-1 text-sm dark:bg-muted/40">
                {templates.map((template) => (
                  <li
                    key={template.id}
                    className="flex items-center gap-2 border-b border-dashed border-border/60 px-2 py-2 last:border-b-0 dark:border-border/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{template.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {template.payload.content ||
                          `${template.payload.embeds?.length ?? 0} embed(s)`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={mono}
                      onClick={() => {
                        onImport(template.payload);
                        setOpen(false);
                        toast.success("Template loaded", {
                          description: template.name,
                        });
                      }}
                    >
                      <FolderOpen />
                      Load
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${template.name}`}
                      onClick={() =>
                        saveTemplates(
                          templates.filter((t) => t.id !== template.id),
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
