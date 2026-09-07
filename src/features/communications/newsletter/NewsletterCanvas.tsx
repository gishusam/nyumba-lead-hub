import { useRef } from "react";
import { isSafeLink, renderNewsletter, validateNewsletter } from "./render-newsletter";
import type { NewsletterDraft } from "./types";

function draftForLocalPreview(draft: NewsletterDraft): NewsletterDraft {
  if (draft.advancedHtmlMode) return draft;
  return {
    ...draft,
    blocks: draft.blocks.map((block) =>
      block.type === "image" && !block.url && block.previewUrl
        ? { ...block, url: block.previewUrl }
        : block,
    ),
  };
}

function wirePreviewLinks(iframe: HTMLIFrameElement | null) {
  const doc = iframe?.contentDocument;
  if (!doc) return;

  doc.onclick = (event) => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest?.("a");
    if (!anchor) return;

    event.preventDefault();
    const href = anchor.getAttribute("href")?.trim() ?? "";
    if (!isSafeLink(href)) return;

    window.open(href, "_blank", "noopener,noreferrer");
  };
}

export function NewsletterCanvas({ draft }: { draft: NewsletterDraft }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewDraft = draftForLocalPreview(draft);
  const rendered = renderNewsletter(previewDraft, {
    contact_name: "Jane",
    company_name: "Acme Realty",
    area: "Kilimani",
    unsubscribe_url: "https://nyumbazetu.com/unsubscribe-preview",
  });
  const errors = validateNewsletter(draft);

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="font-semibold">Before this newsletter can be sent:</div>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-border bg-muted/20 p-4 sm:p-6">
        <iframe
          ref={iframeRef}
          title="Newsletter visual preview"
          srcDoc={rendered.html}
          sandbox="allow-same-origin"
          onLoad={() => wirePreviewLinks(iframeRef.current)}
          className="mx-auto h-[680px] w-full max-w-[660px] rounded-lg border border-border bg-white shadow-sm"
        />
      </div>
    </div>
  );
}
