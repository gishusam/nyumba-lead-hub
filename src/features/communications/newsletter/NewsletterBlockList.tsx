import {
  ArrowDown,
  ArrowUp,
  Copy,
  Heading1,
  Image,
  LayoutGrid,
  Minus,
  MousePointerClick,
  Plus,
  Space,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NewsletterBlock, NewsletterDraft } from "./types";

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function newBlock(type: NewsletterBlock["type"]): NewsletterBlock {
  if (type === "heading") {
    return { id: makeId("heading"), type, text: "New heading", level: 2, align: "left" };
  }
  if (type === "text") {
    return { id: makeId("text"), type, text: "Add your message here.", align: "left" };
  }
  if (type === "image") {
    return { id: makeId("image"), type, url: "", alt: "", align: "center", width: 100 };
  }
  if (type === "button") {
    return {
      id: makeId("button"),
      type,
      label: "Book a Demo",
      destinationType: "calendar",
      url: "",
      align: "left",
    };
  }
  if (type === "feature-row") {
    return {
      id: makeId("features"),
      type,
      items: [
        { title: "Feature one", body: "Describe the benefit." },
        { title: "Feature two", body: "Describe the benefit." },
        { title: "Feature three", body: "Describe the benefit." },
      ],
    };
  }
  if (type === "divider") {
    return { id: makeId("divider"), type, thickness: 1 };
  }
  return { id: makeId("spacer"), type, height: 24 };
}

const addOptions = [
  { type: "heading" as const, label: "Heading", icon: Heading1 },
  { type: "text" as const, label: "Text", icon: Type },
  { type: "image" as const, label: "Image", icon: Image },
  { type: "button" as const, label: "CTA", icon: MousePointerClick },
  { type: "feature-row" as const, label: "Features", icon: LayoutGrid },
  { type: "divider" as const, label: "Divider", icon: Minus },
  { type: "spacer" as const, label: "Spacer", icon: Space },
];

function blockLabel(block: NewsletterBlock): string {
  if (block.type === "heading") return block.text || "Heading";
  if (block.type === "text") return block.text || "Text";
  if (block.type === "image") return block.alt || "Image";
  if (block.type === "button") return block.label || "CTA";
  if (block.type === "feature-row") return "Feature row";
  if (block.type === "divider") return "Divider";
  return "Spacer";
}

export function NewsletterBlockList({
  draft,
  selectedBlockId,
  onSelect,
  onChange,
}: {
  draft: NewsletterDraft;
  selectedBlockId: string | null;
  onSelect: (id: string) => void;
  onChange: (draft: NewsletterDraft) => void;
}) {
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.blocks.length) return;
    const blocks = [...draft.blocks];
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    onChange({ ...draft, blocks });
  };

  const duplicate = (index: number) => {
    const source = draft.blocks[index];
    const copy = { ...source, id: makeId(source.type) } as NewsletterBlock;
    const blocks = [...draft.blocks];
    blocks.splice(index + 1, 0, copy);
    onChange({ ...draft, blocks });
    onSelect(copy.id);
  };

  const remove = (index: number) => {
    const removed = draft.blocks[index];
    const blocks = draft.blocks.filter((_, i) => i !== index);
    onChange({ ...draft, blocks });
    if (selectedBlockId === removed.id) onSelect(blocks[0]?.id ?? "");
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Add content
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {addOptions.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                const block = newBlock(type);
                onChange({ ...draft, blocks: [...draft.blocks, block] });
                onSelect(block.id);
              }}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-xs font-medium hover:border-primary/30 hover:bg-primary/5"
            >
              <Plus className="h-3.5 w-3.5" />
              <Icon className="h-4 w-4 text-muted-foreground" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Email blocks
        </div>
        {draft.blocks.map((block, index) => {
          const selected = block.id === selectedBlockId;
          return (
            <div
              key={block.id}
              className={`rounded-lg border p-2 ${
                selected ? "border-primary bg-primary/5" : "border-border bg-background"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(block.id)}
                className="w-full truncate px-1 py-1 text-left text-xs font-medium"
              >
                {blockLabel(block)}
              </button>
              <div className="mt-1 flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(index, -1)} disabled={index === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(index, 1)} disabled={index === draft.blocks.length - 1}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicate(index)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(index)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
