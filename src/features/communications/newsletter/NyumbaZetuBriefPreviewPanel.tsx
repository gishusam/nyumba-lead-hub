import { renderNewsletter } from "./render-newsletter";
import type { NewsletterDraft } from "./types";

export function NyumbaZetuBriefPreviewPanel({
  draft,
}: {
  draft: NewsletterDraft;
}) {
  const rendered = renderNewsletter(draft, {
    contact_name: "Jane",
    company_name: "Acme Realty",
    area: "Kilimani",
    unsubscribe_url: "https://nyumbazetu.com/unsubscribe-preview",
  });

  return (
    <aside className="self-start rounded-xl border border-border bg-card p-4 shadow-sm xl:sticky xl:top-4">
      <div>
        <h3 className="text-sm font-semibold">Email preview</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Check the final desktop and mobile email while you edit.
        </p>
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Desktop preview
        </div>

        <div className="mt-2 h-[320px] overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <iframe
            title="Nyumba Zetu Brief desktop preview"
            srcDoc={rendered.html}
            className="pointer-events-none origin-top-left border-0 bg-white"
            style={{
              width: "640px",
              height: "760px",
              transform: "scale(0.42)",
            }}
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Mobile preview
        </div>

        <div className="mx-auto mt-2 h-[365px] w-[180px] overflow-hidden rounded-[1.5rem] border-[6px] border-slate-900 bg-white shadow-sm">
          <iframe
            title="Nyumba Zetu Brief mobile preview"
            srcDoc={rendered.html}
            className="pointer-events-none origin-top-left border-0 bg-white"
            style={{
              width: "375px",
              height: "760px",
              transform: "scale(0.48)",
            }}
          />
        </div>
      </div>
    </aside>
  );
}
