import { Code2, LayoutTemplate } from "lucide-react";
import { useMemo, useState } from "react";
import type { CampaignDraftState } from "../types";
import { createNewsletterFromTemplate } from "./templates";
import { NewsletterBlockEditor } from "./NewsletterBlockEditor";
import { NewsletterBlockList } from "./NewsletterBlockList";
import { NewsletterCanvas } from "./NewsletterCanvas";
import { NewsletterHtmlSource } from "./NewsletterHtmlSource";
import { NewsletterTemplatePicker } from "./NewsletterTemplatePicker";
import { NyumbaZetuBriefEditor } from "./NyumbaZetuBriefEditor";
import { NyumbaZetuBriefPreviewPanel } from "./NyumbaZetuBriefPreviewPanel";
import type { NewsletterDraft, NewsletterTemplateKey } from "./types";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

type EditorMode = "visual" | "html";

export function NewsletterComposer({
  state,
  onChange,
}: {
  state: CampaignDraftState;
  onChange: (state: CampaignDraftState) => void;
}) {
  const draft = state.newsletter ?? createNewsletterFromTemplate("book-demo");
  const isBrief = draft.templateKey === "nyumba-zetu-brief";
  const [mode, setMode] = useState<EditorMode>(draft.advancedHtmlMode ? "html" : "visual");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(draft.blocks[0]?.id ?? null);

  const selectedExists = useMemo(
    () => draft.blocks.some((block) => block.id === selectedBlockId),
    [draft.blocks, selectedBlockId],
  );
  const effectiveSelected = selectedExists ? selectedBlockId : draft.blocks[0]?.id ?? null;

  const setDraft = (newsletter: NewsletterDraft) => onChange({ ...state, newsletter });

  const useTemplate = (templateKey: NewsletterTemplateKey) => {
    const newsletter = createNewsletterFromTemplate(templateKey);
    setDraft(newsletter);
    setSelectedBlockId(newsletter.blocks[0]?.id ?? null);
    setMode("visual");
  };

  return (
    <section className="space-y-5">
      {!isBrief && (
        <>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Compose newsletter</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Start from a Nyumba Zetu template, edit visually, or switch to HTML source when you need full control.
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
            <button
              type="button"
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${mode === "visual" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              onClick={() => setMode("visual")}
            >
              <LayoutTemplate className="h-4 w-4" />
              Visual Editor
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${mode === "html" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              onClick={() => setMode("html")}
            >
              <Code2 className="h-4 w-4" />
              HTML Source
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Sender name</span>
            <input className={inputClass} value={state.senderName} onChange={(event) => onChange({ ...state, senderName: event.target.value })} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Sender email</span>
            <input className={inputClass} type="email" placeholder="sales@nyumbazetu.com" value={state.senderEmail} onChange={(event) => onChange({ ...state, senderEmail: event.target.value })} />
          </label>
        </div>
        <label className="mt-4 grid gap-2">
          <span className="text-sm font-medium">Subject</span>
          <input className={inputClass} value={state.subject} onChange={(event) => onChange({ ...state, subject: event.target.value })} />
        </label>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branded templates</div>
        <NewsletterTemplatePicker selected={draft.templateKey} onUse={useTemplate} />
      </div>

        </>
      )}

      {mode === "html" ? (
        <NewsletterHtmlSource draft={draft} onChange={setDraft} />
      ) : draft.templateKey === "nyumba-zetu-brief" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">
                Nyumba Zetu Brief workspace
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Edit campaign content while the branded design stays locked.
              </div>
            </div>
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[22rem_minmax(34rem,1fr)_21rem]">
            <div className="space-y-4 self-start">
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Template
                </div>

                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="text-sm font-semibold">
                    Nyumba Zetu Brief
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Locked branded editorial template
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email details
                </div>

                <div className="mt-4 space-y-4">
                  <label className="grid gap-2">
                    <span className="text-xs font-medium">Subject</span>
                    <input
                      className={inputClass}
                      value={state.subject}
                      onChange={(event) =>
                        onChange({
                          ...state,
                          subject: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-medium">Sender name</span>
                    <input
                      className={inputClass}
                      value={state.senderName}
                      onChange={(event) =>
                        onChange({
                          ...state,
                          senderName: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-medium">Sender email</span>
                    <input
                      className={inputClass}
                      type="email"
                      placeholder="sales@nyumbazetu.com"
                      value={state.senderEmail}
                      onChange={(event) =>
                        onChange({
                          ...state,
                          senderEmail: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              </section>

              <NyumbaZetuBriefEditor
                draft={draft}
                onChange={setDraft}
              />
            </div>

            <main className="min-w-0">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Newsletter canvas
              </div>

              <NewsletterCanvas draft={draft} />
            </main>

            <NyumbaZetuBriefPreviewPanel draft={draft} />
          </div>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[15rem_minmax(0,1fr)_18rem]">
          <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <NewsletterBlockList
              draft={draft}
              selectedBlockId={effectiveSelected}
              onSelect={(id) => setSelectedBlockId(id || null)}
              onChange={setDraft}
            />
          </aside>
          <main className="min-w-0">
            <NewsletterCanvas draft={draft} />
          </main>
          <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Block settings</div>
            <NewsletterBlockEditor draft={draft} selectedBlockId={effectiveSelected} onChange={setDraft} />
          </aside>
        </div>
      )}
    </section>
  );
}
