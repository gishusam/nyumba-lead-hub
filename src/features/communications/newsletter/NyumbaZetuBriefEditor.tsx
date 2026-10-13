import type { NewsletterBlock, NewsletterDraft } from "./types";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function updateBlock(
  draft: NewsletterDraft,
  id: string,
  update: (block: NewsletterBlock) => NewsletterBlock,
): NewsletterDraft {
  return {
    ...draft,
    blocks: draft.blocks.map((block) =>
      block.id === id ? update(block) : block,
    ),
  };
}

export function NyumbaZetuBriefEditor({
  draft,
  onChange,
}: {
  draft: NewsletterDraft;
  onChange: (draft: NewsletterDraft) => void;
}) {
  const heading = draft.blocks.find((block) => block.type === "heading");
  const intro = draft.blocks.find((block) => block.type === "text");
  const button = draft.blocks.find((block) => block.type === "button");
  const features = draft.blocks.find((block) => block.type === "feature-row");

  return (
    <aside className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h3 className="text-base font-semibold">Nyumba Zetu Brief editor</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Design and imagery are locked. Edit your text and links below.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {heading?.type === "heading" && (
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Headline
            </span>
            <textarea
              className={`${inputClass} min-h-28 resize-y`}
              value={heading.text}
              onChange={(event) =>
                onChange(
                  updateBlock(draft, heading.id, (block) =>
                    block.type === "heading"
                      ? { ...block, text: event.target.value }
                      : block,
                  ),
                )
              }
            />
          </label>
        )}

        {intro?.type === "text" && (
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Intro copy
            </span>
            <textarea
              className={`${inputClass} min-h-32 resize-y`}
              value={intro.text}
              onChange={(event) =>
                onChange(
                  updateBlock(draft, intro.id, (block) =>
                    block.type === "text"
                      ? { ...block, text: event.target.value }
                      : block,
                  ),
                )
              }
            />
          </label>
        )}

        {button?.type === "button" && (
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                CTA label
              </span>
              <input
                className={inputClass}
                value={button.label}
                onChange={(event) =>
                  onChange(
                    updateBlock(draft, button.id, (block) =>
                      block.type === "button"
                        ? { ...block, label: event.target.value }
                        : block,
                    ),
                  )
                }
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                CTA URL
              </span>
              <input
                className={inputClass}
                placeholder="https://..."
                value={button.url}
                onChange={(event) =>
                  onChange(
                    updateBlock(draft, button.id, (block) =>
                      block.type === "button"
                        ? { ...block, url: event.target.value }
                        : block,
                    ),
                  )
                }
              />
            </label>
          </div>
        )}

        {features?.type === "feature-row" && (
          <div className="space-y-4 border-t border-border pt-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Feature cards
            </div>

            {features.items.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="space-y-3 rounded-lg border border-border bg-muted/20 p-3"
              >
                <label className="grid gap-2">
                  <span className="text-xs font-medium">
                    Feature {index + 1} title
                  </span>
                  <input
                    className={inputClass}
                    value={item.title}
                    onChange={(event) => {
                      const items = features.items.map((current, itemIndex) =>
                        itemIndex === index
                          ? { ...current, title: event.target.value }
                          : current,
                      );

                      onChange(
                        updateBlock(draft, features.id, (block) =>
                          block.type === "feature-row"
                            ? { ...block, items }
                            : block,
                        ),
                      );
                    }}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-medium">
                    Feature {index + 1} copy
                  </span>
                  <textarea
                    className={`${inputClass} min-h-20 resize-y`}
                    value={item.body}
                    onChange={(event) => {
                      const items = features.items.map((current, itemIndex) =>
                        itemIndex === index
                          ? { ...current, body: event.target.value }
                          : current,
                      );

                      onChange(
                        updateBlock(draft, features.id, (block) =>
                          block.type === "feature-row"
                            ? { ...block, items }
                            : block,
                        ),
                      );
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
