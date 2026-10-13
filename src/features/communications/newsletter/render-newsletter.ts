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

function emailAssetUrl(
  filename: string,
  p: NewsletterPersonalization,
): string {
  const base = (p.asset_base_url ?? "").replace(/\/+$/, "");
  return `${base}/email/${filename}`;
}

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

function renderNyumbaZetuBrief(
  draft: NewsletterDraft,
  p: NewsletterPersonalization,
): string {
  const headingBlock = draft.blocks.find((block) => block.type === "heading");
  const textBlock = draft.blocks.find((block) => block.type === "text");
  const imageBlock = draft.blocks.find((block) => block.type === "image");
  const featureBlock = draft.blocks.find((block) => block.type === "feature-row");
  const buttonBlock = draft.blocks.find((block) => block.type === "button");

  const heading =
    headingBlock?.type === "heading"
      ? textToHtml(personalize(headingBlock.text, p))
      : "Run better properties.<br />Grow with confidence.";

  const intro =
    textBlock?.type === "text"
      ? textToHtml(personalize(textBlock.text, p))
      : "";

  const companyName = escapeHtml(p.company_name || "your team");

  const image =
    imageBlock?.type === "image" && isHttpsUrl(imageBlock.url)
      ? `<img
          src="${escapeHtml(imageBlock.url)}"
          alt="${escapeHtml(imageBlock.alt)}"
          width="300"
          style="display:block;width:100%;max-width:300px;height:100%;min-height:320px;object-fit:cover;border:0;"
        />`
      : `<div style="min-height:320px;background:#dce8e1;display:flex;align-items:center;justify-content:center;font-family:Arial,Helvetica,sans-serif;color:${BRAND_GREEN};font-size:12px;font-weight:700;letter-spacing:1px;">
          PROPERTY IMAGE
        </div>`;

  const featureItems =
    featureBlock?.type === "feature-row"
      ? featureBlock.items.slice(0, 3)
      : [];

  const featureIcons = [
    {
      label: "Stay organized icon",
      src: emailAssetUrl("feature-home.png", p),
    },
    {
      label: "Follow up faster icon",
      src: emailAssetUrl("feature-users.png", p),
    },
    {
      label: "Make smarter decisions icon",
      src: emailAssetUrl("feature-chart.png", p),
    },
  ] as const;

  const featureCells = featureItems
    .map((item, index) => {
      const icon = featureIcons[index] ?? featureIcons[0];

      return `
        <td
          class="nz-feature"
          valign="top"
          style="width:33.33%;padding:28px 22px;background:${BRAND_MINT};border:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;color:${BRAND_GREEN_DARK};"
        >
          <div style="height:38px;margin-bottom:14px;">
            <img
              src="${escapeHtml(icon.src)}"
              width="34"
              height="34"
              alt="${escapeHtml(icon.label)}"
              aria-label="${escapeHtml(icon.label)}"
              style="display:block;width:34px;height:34px;border:0;outline:none;"
            />
          </div>

          <div style="font-size:15px;font-weight:800;line-height:1.35;">
            ${escapeHtml(personalize(item.title, p))}
          </div>

          <div style="margin-top:10px;font-size:12px;line-height:1.6;color:${MUTED};">
            ${escapeHtml(personalize(item.body, p))}
          </div>
        </td>`;
    })
    .join("");

  const ctaLabel =
    buttonBlock?.type === "button"
      ? escapeHtml(personalize(buttonBlock.label, p))
      : "Book a Demo";

  const ctaUrl =
    buttonBlock?.type === "button" && isSafeLink(buttonBlock.url)
      ? buttonBlock.url
      : "";

  const ctaMarkup = ctaUrl
    ? `<a
        href="${escapeHtml(ctaUrl)}"
        target="_blank"
        rel="noreferrer"
        style="display:inline-block;background:${BRAND_GREEN};color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;padding:14px 24px;border-radius:5px;"
      >${ctaLabel}&nbsp;→</a>`
    : `<span
        style="display:inline-block;background:${BRAND_GREEN};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;padding:14px 24px;border-radius:5px;"
      >${ctaLabel}&nbsp;→</span>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    @media only screen and (max-width: 480px) {
      .nz-container { width: 100% !important; }
      .nz-hero-copy,
      .nz-hero-image,
      .nz-feature {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .nz-hero-image img {
        max-width: 100% !important;
        width: 100% !important;
        min-height: 240px !important;
      }
      .nz-heading {
        font-size: 34px !important;
      }
      .nz-padding {
        padding-left: 24px !important;
        padding-right: 24px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background:#edf2ee;">
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="width:100%;background:#edf2ee;"
  >
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table
          class="nz-container"
          role="presentation"
          width="640"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="width:100%;max-width:640px;background:#ffffff;border:1px solid ${BORDER};"
        >

          <tr>
            <td
              colspan="2"
              style="padding:11px 28px;background:${BRAND_GREEN_DARK};border-bottom:1px solid ${BRAND_GREEN_DARK};font-family:Arial,Helvetica,sans-serif;"
            >
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size:10px;font-weight:800;letter-spacing:1.5px;color:#ffffff;">
                    THE NYUMBA ZETU BRIEF
                  </td>
                  <td align="right" style="font-size:10px;font-weight:700;letter-spacing:.8px;color:#d9e7e1;">
                    ISSUE 01 · OCTOBER 2026
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td
              colspan="2"
              style="padding:22px 30px;border-bottom:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;"
            >
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size:18px;font-weight:900;letter-spacing:.4px;color:${BRAND_GREEN_DARK};">
                    <img
                      src="${escapeHtml(emailAssetUrl("nyumba-zetu-mark.png", p))}"
                      width="28"
                      height="38"
                      alt="Nyumba Zetu mark"
                      aria-label="Nyumba Zetu mark"
                      style="display:inline-block;width:28px;height:38px;border:0;outline:none;vertical-align:middle;"
                    />
                    <span style="vertical-align:middle;">NYUMBA ZETU</span>
                  </td>
                  <td align="right" style="font-size:11px;color:${MUTED};">
                    Insights and practical tips for property teams
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td
              class="nz-hero-copy"
              valign="middle"
              width="54%"
              style="width:54%;padding:42px 36px;background:#eaf4ef;font-family:Arial,Helvetica,sans-serif;"
            >
              <div
                style="margin-bottom:18px;font-size:10px;font-weight:900;letter-spacing:1.6px;color:${BRAND_GREEN};"
              >
                SMARTER OPERATIONS
              </div>

              <div
                class="nz-heading"
                style="font-family:Georgia,'Times New Roman',serif;font-size:40px;line-height:1.04;font-weight:700;letter-spacing:-1.2px;color:${BRAND_GREEN_DARK};"
              >
                ${heading}
              </div>

              <div
                style="margin-top:24px;font-size:13px;line-height:1.65;color:${TEXT};"
              >
                ${intro}
              </div>

              <div style="margin-top:22px;">
                ${ctaMarkup}
              </div>
            </td>

            <td
              class="nz-hero-image"
              valign="middle"
              width="46%"
              style="width:46%;padding:0;background:#dce8e1;"
            >
              ${image}
            </td>
          </tr>

          ${
            featureCells
              ? `<tr>
                  <td colspan="2" style="padding:20px 18px;background:#ffffff;">
                    <table role="presentation" width="100%" cellspacing="10" cellpadding="0" border="0">
                      <tr>${featureCells}</tr>
                    </table>
                  </td>
                </tr>`
              : ""
          }

          <tr>
            <td
              colspan="2"
              align="center"
              class="nz-padding"
              style="padding:38px 38px;background:${BRAND_MINT};font-family:Arial,Helvetica,sans-serif;"
            >
              <div
                style="font-size:24px;line-height:1.25;font-weight:900;color:${BRAND_GREEN_DARK};"
              >
                Ready to see what Nyumba Zetu can do for ${companyName}?
              </div>

              <div style="margin-top:22px;">
                ${ctaMarkup}
              </div>
            </td>
          </tr>

          <tr>
            <td
              colspan="2"
              class="nz-padding"
              style="padding:28px 32px 22px;background:#ffffff;border-top:1px solid ${BORDER};font-family:Arial,Helvetica,sans-serif;color:${BRAND_GREEN_DARK};"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td valign="top">
                    <table
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                    >
                      <tr>
                        <td
                          valign="middle"
                          style="padding-right:12px;"
                        >
                          <img
                      src="${escapeHtml(emailAssetUrl("nyumba-zetu-mark.png", p))}"
                      width="28"
                      height="38"
                      alt="Nyumba Zetu mark"
                      aria-label="Nyumba Zetu mark"
                      style="display:inline-block;width:28px;height:38px;border:0;outline:none;vertical-align:middle;"
                    />
                        </td>

                        <td valign="middle">
                          <div
                            style="font-size:16px;font-weight:900;letter-spacing:.4px;color:${BRAND_GREEN_DARK};"
                          >
                            NYUMBA ZETU
                          </div>

                          <div
                            style="margin-top:5px;font-size:11px;line-height:1.5;color:${MUTED};"
                          >
                            Software for better organised property teams
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <td
                    align="right"
                    valign="middle"
                    style="white-space:nowrap;"
                  >
                    <img
                      src="${escapeHtml(emailAssetUrl("linkedin.png", p))}"
                      width="18"
                      height="18"
                      alt="LinkedIn"
                      aria-label="LinkedIn"
                      style="display:inline-block;margin-left:14px;width:18px;height:18px;border:0;outline:none;vertical-align:middle;"
                    />

                    <img
                      src="${escapeHtml(emailAssetUrl("x.png", p))}"
                      width="18"
                      height="18"
                      alt="X"
                      aria-label="X"
                      style="display:inline-block;margin-left:14px;width:18px;height:18px;border:0;outline:none;vertical-align:middle;"
                    />

                    <img
                      src="${escapeHtml(emailAssetUrl("youtube.png", p))}"
                      width="21"
                      height="18"
                      alt="YouTube"
                      aria-label="YouTube"
                      style="display:inline-block;margin-left:14px;width:21px;height:18px;border:0;outline:none;vertical-align:middle;"
                    />
                  </td>
                </tr>

                <tr>
                  <td
                    colspan="2"
                    style="padding-top:18px;font-size:11px;line-height:1.8;color:${MUTED};"
                  >
                    <a
                      href="${escapeHtml(p.unsubscribe_url)}"
                      style="color:${MUTED};text-decoration:none;"
                    >Unsubscribe</a>

                    <span>&nbsp;&nbsp;·&nbsp;&nbsp;</span>

                    <a
                      href="${escapeHtml(p.unsubscribe_url)}"
                      style="color:${MUTED};text-decoration:none;"
                    >Manage preferences</a>

                    <span>&nbsp;&nbsp;·&nbsp;&nbsp;</span>

                    <a
                      href="https://nyumbazetu.com"
                      style="color:${MUTED};text-decoration:none;"
                    >Visit our website</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function visualHtml(draft: NewsletterDraft, p: NewsletterPersonalization): string {
  if (draft.templateKey === "nyumba-zetu-brief") {
    return renderNyumbaZetuBrief(draft, p);
  }

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
