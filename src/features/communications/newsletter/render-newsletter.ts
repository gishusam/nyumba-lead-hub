import type {
  NewsletterBlock,
  NewsletterDraft,
  NewsletterPersonalization,
  RenderedNewsletter,
} from "./types";

const BRAND_GREEN = "#124E3A";
const BRAND_GREEN_DARK = "#0B3528";
const BRAND_MINT = "#F1F7F3";
const TEXT = "#17211B";
const MUTED = "#5C6B63";
const BORDER = "#DDE8E1";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function personalize(value: string, p: NewsletterPersonalization): string {
  return value
    .replaceAll("{contact_name}", p.contact_name || "there")
    .replaceAll("{company_name}", p.company_name || "your team")
    .replaceAll("{area}", p.area || "your area")
    .replaceAll("{unsubscribe_url}", p.unsubscribe_url);
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isWhatsappUrl(value: string): boolean {
  if (!isHttpsUrl(value)) return false;
  const host = new URL(value).hostname.toLowerCase();
  return host === "wa.me" || host === "api.whatsapp.com" || host.endsWith(".whatsapp.com");
}

export function isSafeLink(value: string, allowWhatsapp = true): boolean {
  if (!isHttpsUrl(value)) return false;
  return allowWhatsapp || !isWhatsappUrl(value);
}

function textToHtml(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function renderBlock(block: NewsletterBlock, p: NewsletterPersonalization): string {
  if (block.type === "heading") {
    const size = block.level === 1 ? 32 : block.level === 2 ? 24 : 19;
    const value = textToHtml(personalize(block.text, p));
    return `<tr><td style="padding:8px 36px 12px;text-align:${block.align};font-family:Arial,Helvetica,sans-serif;color:${TEXT};font-size:${size}px;line-height:1.2;font-weight:700;">${value}</td></tr>`;
  }

  if (block.type === "text") {
    const value = textToHtml(personalize(block.text, p));
    return `<tr><td style="padding:8px 36px 16px;text-align:${block.align};font-family:Arial,Helvetica,sans-serif;color:${TEXT};font-size:16px;line-height:1.65;">${value}</td></tr>`;
  }

  if (block.type === "image") {
    if (!block.url || !isHttpsUrl(block.url)) return "";
    const image = `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt)}" width="${Math.round(560 * (block.width / 100))}" style="display:block;max-width:${block.width}%;height:auto;border:0;margin:${block.align === "center" ? "0 auto" : block.align === "right" ? "0 0 0 auto" : "0 auto 0 0"};" />`;
    const linked = block.linkUrl && isSafeLink(block.linkUrl)
      ? `<a href="${escapeHtml(block.linkUrl)}" target="_blank" rel="noreferrer">${image}</a>`
      : image;
    return `<tr><td style="padding:12px 36px 20px;">${linked}</td></tr>`;
  }

  if (block.type === "button") {
    if (!block.label.trim() || !isSafeLink(block.url)) return "";
    return `<tr><td style="padding:12px 36px 24px;text-align:${block.align};"><a href="${escapeHtml(block.url)}" target="_blank" rel="noreferrer" style="display:inline-block;background:${BRAND_GREEN};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;padding:13px 22px;border-radius:6px;">${escapeHtml(personalize(block.label, p))}</a></td></tr>`;
  }

  if (block.type === "feature-row") {
    const cells = block.items.slice(0, 4).map((item) => {
      const title = escapeHtml(personalize(item.title, p));
      const body = escapeHtml(personalize(item.body, p));
      return `<td valign="top" style="width:${Math.floor(100 / Math.max(block.items.length, 1))}%;padding:14px;background:${BRAND_MINT};border:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;"><div style="font-size:15px;line-height:1.35;font-weight:700;color:${BRAND_GREEN_DARK};">${title}</div><div style="margin-top:6px;font-size:13px;line-height:1.5;color:${MUTED};">${body}</div></td>`;
    }).join("");
    return `<tr><td style="padding:10px 36px 22px;"><table role="presentation" width="100%" cellspacing="8" cellpadding="0" border="0"><tr>${cells}</tr></table></td></tr>`;
  }

  if (block.type === "divider") {
    return `<tr><td style="padding:10px 36px;"><div style="border-top:${block.thickness}px solid ${BORDER};font-size:0;line-height:0;">&nbsp;</div></td></tr>`;
  }

  return `<tr><td height="${block.height}" style="height:${block.height}px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

function blockToText(block: NewsletterBlock, p: NewsletterPersonalization): string {
  if (block.type === "heading" || block.type === "text") {
    return personalize(block.text, p).trim();
  }
  if (block.type === "image") {
    return block.alt.trim();
  }
  if (block.type === "button") {
    return block.label.trim() && block.url.trim()
      ? `${personalize(block.label, p)}: ${block.url}`
      : "";
  }
  if (block.type === "feature-row") {
    return block.items
      .map((item) => `${personalize(item.title, p)}\n${personalize(item.body, p)}`)
      .join("\n\n");
  }
  return "";
}

function brandedHeader(): string {
  return `<tr><td style="padding:22px 36px;background:#ffffff;border-bottom:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;"><div style="font-size:20px;font-weight:800;letter-spacing:.5px;color:${BRAND_GREEN_DARK};">NYUMBA ZETU</div><div style="margin-top:3px;font-size:12px;color:${MUTED};">Software for better organized real-estate teams</div></td></tr>`;
}

function brandedFooter(p: NewsletterPersonalization): string {
  return `<tr><td style="padding:24px 36px;background:${BRAND_MINT};border-top:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;color:${MUTED};font-size:12px;line-height:1.6;"><strong style="color:${BRAND_GREEN_DARK};">Nyumba Zetu</strong><br />You are receiving this email because your contact is part of a Nyumba Zetu communication audience.<br /><a href="${escapeHtml(p.unsubscribe_url)}" style="color:${BRAND_GREEN};">Unsubscribe</a></td></tr>`;
}

function visualHtml(draft: NewsletterDraft, p: NewsletterPersonalization): string {
  const body = draft.blocks.map((block) => renderBlock(block, p)).join("");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F5F7F5;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5F7F5;"><tr><td align="center" style="padding:28px 12px;"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;">${draft.headerLocked ? brandedHeader() : ""}${body}${draft.footerLocked ? brandedFooter(p) : ""}</table></td></tr></table></body></html>`;
}

function advancedHtml(draft: NewsletterDraft, p: NewsletterPersonalization): string {
  const source = personalize(draft.htmlSource, p);
  if (!draft.headerLocked && !draft.footerLocked) return source;

  return `<!doctype html><html><body style="margin:0;padding:0;background:#F5F7F5;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:28px 12px;"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;">${draft.headerLocked ? brandedHeader() : ""}<tr><td>${source}</td></tr>${draft.footerLocked ? brandedFooter(p) : ""}</table></td></tr></table></body></html>`;
}

export function renderNewsletter(
  draft: NewsletterDraft,
  personalization: NewsletterPersonalization,
): RenderedNewsletter {
  const html = draft.advancedHtmlMode && draft.htmlSource.trim()
    ? advancedHtml(draft, personalization)
    : visualHtml(draft, personalization);

  const text = draft.blocks
    .map((block) => blockToText(block, personalization))
    .filter(Boolean)
    .join("\n\n")
    .concat(`\n\nUnsubscribe: ${personalization.unsubscribe_url}`);

  return { html, text };
}

function hasUnsafeAdvancedHtml(value: string): boolean {
  return /<\s*(script|iframe|object|embed|form)\b/i.test(value)
    || /javascript\s*:/i.test(value)
    || /\son[a-z]+\s*=/i.test(value);
}

export function validateNewsletter(draft: NewsletterDraft): string[] {
  const errors: string[] = [];

  if (draft.advancedHtmlMode) {
    if (!draft.htmlSource.trim()) errors.push("HTML source cannot be empty in advanced mode.");
    if (hasUnsafeAdvancedHtml(draft.htmlSource)) errors.push("HTML source contains unsupported or unsafe markup.");
    if (!draft.footerLocked && !draft.htmlSource.includes("{unsubscribe_url}")) {
      errors.push("Unlocked HTML footer must include {unsubscribe_url}.");
    }
    return errors;
  }

  const meaningful = draft.blocks.some((block) => {
    if (block.type === "heading" || block.type === "text") return Boolean(block.text.trim());
    if (block.type === "feature-row") {
      return block.items.some((item) => Boolean(item.title.trim() || item.body.trim()));
    }
    if (block.type === "image") return Boolean(block.url.trim() || block.previewUrl?.trim());
    return false;
  });

  if (!meaningful) errors.push("Newsletter must contain meaningful content.");

  for (const block of draft.blocks) {
    if (block.type === "button") {
      if (!block.label.trim()) errors.push("CTA label is required.");
      if (!isSafeLink(block.url)) errors.push("CTA link must use https:// or WhatsApp.");
      if (block.destinationType === "whatsapp" && block.url && !isWhatsappUrl(block.url)) {
        errors.push("WhatsApp CTA must use a wa.me or whatsapp.com link.");
      }
    }

    if (block.type === "image") {
      if (block.previewUrl && !block.url) {
        errors.push("Uploaded image needs a public https:// URL before sending.");
      }
      if (block.url && !isHttpsUrl(block.url)) {
        errors.push("Image URL must use https:// before sending.");
      }
      if (block.linkUrl && !isSafeLink(block.linkUrl)) {
        errors.push("Image link must use https://.");
      }
    }
  }

  return [...new Set(errors)];
}

export function applyHtmlSource(draft: NewsletterDraft, htmlSource: string): NewsletterDraft {
  return {
    ...draft,
    htmlSource,
    advancedHtmlMode: true,
  };
}
