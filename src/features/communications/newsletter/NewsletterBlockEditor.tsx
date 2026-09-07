import type { ReactNode } from "react";
import type { NewsletterBlock, NewsletterDraft } from "./types";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function updateBlock(
  draft: NewsletterDraft,
  blockId: string,
  next: NewsletterBlock,
): NewsletterDraft {
  const blocks = draft.blocks.map((block) => (block.id === blockId ? next : block));
  const updated = { ...draft, blocks };
  if (next.type === "button") {
    updated.cta = {
      destinationType: next.destinationType,
      label: next.label,
      url: next.url,
    };
  }
  return updated;
}

export function NewsletterBlockEditor({
  draft,
  selectedBlockId,
  onChange,
}: {
  draft: NewsletterDraft;
  selectedBlockId: string | null;
  onChange: (draft: NewsletterDraft) => void;
}) {
  const block = draft.blocks.find((item) => item.id === selectedBlockId);
  if (!block) {
    return <p className="text-sm text-muted-foreground">Select a block to edit its content.</p>;
  }

  const save = (next: NewsletterBlock) => onChange(updateBlock(draft, block.id, next));

  if (block.type === "heading" || block.type === "text") {
    return (
      <div className="space-y-4">
        <Field label={block.type === "heading" ? "Heading" : "Text"}>
          <textarea
            className={`${inputClass} min-h-32 resize-y`}
            value={block.text}
            onChange={(event) => save({ ...block, text: event.target.value })}
          />
        </Field>
        {block.type === "heading" && (
          <Field label="Size">
            <select className={inputClass} value={block.level} onChange={(event) => save({ ...block, level: Number(event.target.value) as 1 | 2 | 3 })}>
              <option value={1}>Hero</option>
              <option value={2}>Section</option>
              <option value={3}>Small heading</option>
            </select>
          </Field>
        )}
        <Alignment value={block.align} onChange={(align) => save({ ...block, align })} />
        <TokenHint />
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="space-y-4">
        <Field label="Public image URL">
          <input className={inputClass} placeholder="https://..." value={block.url} onChange={(event) => save({ ...block, url: event.target.value })} />
        </Field>
        <Field label="Upload for local preview">
          <input
            className={inputClass}
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (block.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(block.previewUrl);
              save({ ...block, previewUrl: URL.createObjectURL(file) });
            }}
          />
        </Field>
        {block.previewUrl && !block.url && (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Local preview only. Add a public HTTPS image URL before sending.
          </p>
        )}
        <Field label="Alt text">
          <input className={inputClass} value={block.alt} onChange={(event) => save({ ...block, alt: event.target.value })} />
        </Field>
        <Field label="Optional image link">
          <input className={inputClass} placeholder="https://..." value={block.linkUrl ?? ""} onChange={(event) => save({ ...block, linkUrl: event.target.value })} />
        </Field>
        <Field label="Width">
          <select className={inputClass} value={block.width} onChange={(event) => save({ ...block, width: Number(event.target.value) as 25 | 50 | 75 | 100 })}>
            <option value={25}>25%</option>
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
          </select>
        </Field>
        <Alignment value={block.align} onChange={(align) => save({ ...block, align })} />
      </div>
    );
  }

  if (block.type === "button") {
    return (
      <div className="space-y-4">
        <Field label="CTA label">
          <input className={inputClass} value={block.label} onChange={(event) => save({ ...block, label: event.target.value })} />
        </Field>
        <Field label="Destination">
          <select className={inputClass} value={block.destinationType} onChange={(event) => save({ ...block, destinationType: event.target.value as typeof block.destinationType })}>
            <option value="calendar">Calendar / booking</option>
            <option value="landing_page">Landing page / contact form</option>
            <option value="whatsapp">WhatsApp sales</option>
          </select>
        </Field>
        <Field label={block.destinationType === "whatsapp" ? "WhatsApp URL" : "CTA URL"}>
          <input className={inputClass} placeholder={block.destinationType === "whatsapp" ? "https://wa.me/254..." : "https://..."} value={block.url} onChange={(event) => save({ ...block, url: event.target.value })} />
        </Field>
        <Alignment value={block.align} onChange={(align) => save({ ...block, align })} />
      </div>
    );
  }

  if (block.type === "feature-row") {
    return (
      <div className="space-y-4">
        {block.items.map((item, index) => (
          <div key={index} className="rounded-lg border border-border p-3">
            <div className="text-xs font-semibold text-muted-foreground">Feature {index + 1}</div>
            <input
              className={`${inputClass} mt-2`}
              value={item.title}
              onChange={(event) => {
                const items = block.items.map((current, i) => i === index ? { ...current, title: event.target.value } : current);
                save({ ...block, items });
              }}
            />
            <textarea
              className={`${inputClass} mt-2 min-h-20 resize-y`}
              value={item.body}
              onChange={(event) => {
                const items = block.items.map((current, i) => i === index ? { ...current, body: event.target.value } : current);
                save({ ...block, items });
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "divider") {
    return (
      <Field label="Divider thickness">
        <select className={inputClass} value={block.thickness} onChange={(event) => save({ ...block, thickness: Number(event.target.value) as 1 | 2 | 3 })}>
          <option value={1}>Thin</option>
          <option value={2}>Medium</option>
          <option value={3}>Strong</option>
        </select>
      </Field>
    );
  }

  return (
    <Field label="Spacer height">
      <select className={inputClass} value={block.height} onChange={(event) => save({ ...block, height: Number(event.target.value) as 8 | 16 | 24 | 32 | 48 })}>
        {[8, 16, 24, 32, 48].map((height) => <option key={height} value={height}>{height}px</option>)}
      </select>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Alignment({
  value,
  onChange,
}: {
  value: "left" | "center" | "right";
  onChange: (value: "left" | "center" | "right") => void;
}) {
  return (
    <Field label="Alignment">
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value as typeof value)}>
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
      </select>
    </Field>
  );
}

function TokenHint() {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
      Personalization: <code>{"{contact_name}"}</code>, <code>{"{company_name}"}</code>, <code>{"{area}"}</code>
    </div>
  );
}
