"use client";

import { Plus, Trash2 } from "lucide-react";
import { ColorPicker } from "@/components/color-picker";
import { Field, mono } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { EmbedField, EmbedState } from "@/lib/webhook";
import { cn } from "@/lib/utils";

// An inset well, the same as the boxes that hold command lines in a report
const INSET =
  "rounded-lg border border-border bg-background/10 p-3 shadow-inner";

export function EmbedEditor({
  embeds,
  active,
  onActive,
  onAdd,
  onRemove,
  onChange,
  onAddField,
  onRemoveField,
  onChangeField,
  disabled,
}: {
  embeds: EmbedState[];
  active: number;
  onActive: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: <K extends keyof EmbedState>(
    index: number,
    key: K,
    value: EmbedState[K],
  ) => void;
  onAddField: (index: number) => void;
  onRemoveField: (index: number, field: number) => void;
  onChangeField: <K extends keyof EmbedField>(
    index: number,
    field: number,
    key: K,
    value: EmbedField[K],
  ) => void;
  disabled?: boolean;
}) {
  const embed = embeds[active];
  const text = (key: keyof EmbedState, id: string, placeholder: string) => (
    <Input
      id={id}
      placeholder={placeholder}
      value={(embed[key] as string) ?? ""}
      onChange={(e) => onChange(active, key, e.target.value as never)}
      disabled={disabled}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {embeds.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onActive(index)}
            className={cn(
              "h-7 cursor-pointer rounded-md border px-2.5 font-mono text-xs tracking-tight",
              index === active
                ? "border-foreground bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Embed {index + 1}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className={cn(mono, "h-7")}
          onClick={onAdd}
          disabled={embeds.length >= 10 || disabled}
        >
          <Plus />
          Add
        </Button>
        {embeds.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(mono, "ml-auto h-7 text-muted-foreground")}
            onClick={() => onRemove(active)}
            disabled={disabled}
          >
            <Trash2 />
            Remove embed {active + 1}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
        <Field label="Title" htmlFor="embed-title">
          {text("title", "embed-title", "Embed title")}
        </Field>
        <Field label="Colour">
          <ColorPicker
            color={embed.color}
            onChange={(color) => onChange(active, "color", color)}
          />
        </Field>
      </div>
      <Field label="Title link" htmlFor="embed-url">
        {text("url", "embed-url", "https://example.com")}
      </Field>
      <Field
        label="Description"
        htmlFor="embed-description"
        aside={`${embed.description.length}/4096`}
      >
        <Textarea
          id="embed-description"
          placeholder="Markdown works here too"
          className="min-h-24 font-mono text-sm"
          value={embed.description}
          onChange={(e) => onChange(active, "description", e.target.value)}
          disabled={disabled}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Author" htmlFor="embed-author">
          {text("author", "embed-author", "Author name")}
        </Field>
        <Field label="Author icon" htmlFor="embed-author-icon">
          {text(
            "authorIcon",
            "embed-author-icon",
            "https://example.com/icon.png",
          )}
        </Field>
        <Field label="Footer" htmlFor="embed-footer">
          {text("footer", "embed-footer", "Footer text")}
        </Field>
        <Field label="Footer icon" htmlFor="embed-footer-icon">
          {text(
            "footerIcon",
            "embed-footer-icon",
            "https://example.com/icon.png",
          )}
        </Field>
        <Field label="Thumbnail" htmlFor="embed-thumbnail">
          {text(
            "thumbnail",
            "embed-thumbnail",
            "https://example.com/thumbnail.png",
          )}
        </Field>
        <Field label="Image" htmlFor="embed-image">
          {text("image", "embed-image", "https://example.com/image.png")}
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="embed-timestamp"
          checked={Boolean(embed.timestamp)}
          onCheckedChange={(checked) =>
            onChange(
              active,
              "timestamp",
              checked ? new Date().toISOString() : undefined,
            )
          }
          disabled={disabled}
        />
        <label htmlFor="embed-timestamp">
          Show the current time in the footer
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            Fields{" "}
            <span className="font-mono text-xs text-muted-foreground">
              {embed.fields.length}/25
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            className={cn(mono, "h-7")}
            onClick={() => onAddField(active)}
            disabled={embed.fields.length >= 25 || disabled}
          >
            <Plus />
            Add field
          </Button>
        </div>
        {embed.fields.map((field, index) => (
          <div key={index} className={INSET}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
              <Field label="Name" htmlFor={`field-name-${index}`}>
                <Input
                  id={`field-name-${index}`}
                  className="h-8"
                  value={field.name}
                  onChange={(e) =>
                    onChangeField(active, index, "name", e.target.value)
                  }
                  disabled={disabled}
                />
              </Field>
              <Field label="Value" htmlFor={`field-value-${index}`}>
                <Input
                  id={`field-value-${index}`}
                  className="h-8"
                  value={field.value}
                  onChange={(e) =>
                    onChangeField(active, index, "value", e.target.value)
                  }
                  disabled={disabled}
                />
              </Field>
              <div className="flex h-8 items-center gap-2">
                <Switch
                  id={`field-inline-${index}`}
                  checked={field.inline}
                  onCheckedChange={(checked) =>
                    onChangeField(active, index, "inline", checked)
                  }
                  disabled={disabled}
                />
                <label htmlFor={`field-inline-${index}`} className="text-xs">
                  Inline
                </label>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto"
                  aria-label={`Remove field ${index + 1}`}
                  onClick={() => onRemoveField(active, index)}
                  disabled={disabled}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
