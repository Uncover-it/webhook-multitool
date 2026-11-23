"use client";

import { Plus, Trash2 } from "lucide-react";
import { Field, mono } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const DURATIONS = [
  { hours: 1, label: "1h" },
  { hours: 4, label: "4h" },
  { hours: 8, label: "8h" },
  { hours: 24, label: "24h" },
  { hours: 72, label: "3d" },
  { hours: 168, label: "1w" },
];

export function PollEditor({
  question,
  onQuestion,
  answers,
  onAnswer,
  onAddAnswer,
  onRemoveAnswer,
  multiselect,
  onMultiselect,
  duration,
  onDuration,
  disabled,
}: {
  question: string;
  onQuestion: (question: string) => void;
  answers: { text: string }[];
  onAnswer: (index: number, text: string) => void;
  onAddAnswer: () => void;
  onRemoveAnswer: (index: number) => void;
  multiselect: boolean;
  onMultiselect: (multiselect: boolean) => void;
  duration: number;
  onDuration: (hours: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field
        label="Question"
        htmlFor="poll-question"
        aside={`${question.length}/300`}
      >
        <Input
          id="poll-question"
          placeholder="What is your favourite colour?"
          value={question}
          onChange={(e) => onQuestion(e.target.value)}
          disabled={disabled}
        />
      </Field>

      <div className="space-y-2">
        <span className="font-medium">
          Answers{" "}
          <span className="font-mono text-xs text-muted-foreground">
            {answers.length}/10
          </span>
        </span>
        {answers.map((answer, index) => (
          <div key={index} className="flex gap-2">
            <span className="flex w-6 shrink-0 items-center justify-end font-mono text-xs text-muted-foreground">
              {index + 1}
            </span>
            <Input
              aria-label={`Answer ${index + 1}`}
              placeholder={`Answer ${index + 1}`}
              value={answer.text}
              onChange={(e) => onAnswer(index, e.target.value)}
              disabled={disabled}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove answer ${index + 1}`}
              onClick={() => onRemoveAnswer(index)}
              disabled={answers.length <= 2 || disabled}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className={cn(mono, "h-7")}
          onClick={onAddAnswer}
          disabled={answers.length >= 10 || disabled}
        >
          <Plus />
          Add answer
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <Switch
            id="poll-multiselect"
            checked={multiselect}
            onCheckedChange={onMultiselect}
            disabled={disabled}
          />
          <label htmlFor="poll-multiselect">Allow several answers</label>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Runs for</span>
          <div className="flex gap-1">
            {DURATIONS.map((option) => (
              <button
                key={option.hours}
                type="button"
                disabled={disabled}
                onClick={() => onDuration(option.hours)}
                className={cn(
                  "h-7 cursor-pointer rounded-md border px-2 font-mono text-xs tracking-tight disabled:pointer-events-none disabled:opacity-50",
                  duration === option.hours
                    ? "border-foreground bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
