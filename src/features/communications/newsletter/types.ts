export type NewsletterTemplateKey =
  | "book-demo"
  | "product-update"
  | "stay-connected";

export type CtaDestinationType = "calendar" | "landing_page" | "whatsapp";
export type NewsletterAlignment = "left" | "center" | "right";

export type NewsletterHeadingBlock = {
  id: string;
  type: "heading";
  text: string;
  level: 1 | 2 | 3;
  align: NewsletterAlignment;
};

export type NewsletterTextBlock = {
  id: string;
  type: "text";
  text: string;
  align: NewsletterAlignment;
};

export type NewsletterImageBlock = {
  id: string;
  type: "image";
  url: string;
  previewUrl?: string;
  alt: string;
  linkUrl?: string;
  align: NewsletterAlignment;
  width: 25 | 50 | 75 | 100;
};

export type NewsletterButtonBlock = {
  id: string;
  type: "button";
  label: string;
  destinationType: CtaDestinationType;
  url: string;
  align: NewsletterAlignment;
};

export type NewsletterFeature = {
  title: string;
  body: string;
};

export type NewsletterFeatureRowBlock = {
  id: string;
  type: "feature-row";
  items: NewsletterFeature[];
};

export type NewsletterDividerBlock = {
  id: string;
  type: "divider";
  thickness: 1 | 2 | 3;
};

export type NewsletterSpacerBlock = {
  id: string;
  type: "spacer";
  height: 8 | 16 | 24 | 32 | 48;
};

export type NewsletterBlock =
  | NewsletterHeadingBlock
  | NewsletterTextBlock
  | NewsletterImageBlock
  | NewsletterButtonBlock
  | NewsletterFeatureRowBlock
  | NewsletterDividerBlock
  | NewsletterSpacerBlock;

export type NewsletterCtaConfig = {
  destinationType: CtaDestinationType;
  label: string;
  url: string;
};

export type NewsletterDraft = {
  templateKey: NewsletterTemplateKey;
  blocks: NewsletterBlock[];
  htmlSource: string;
  advancedHtmlMode: boolean;
  headerLocked: boolean;
  footerLocked: boolean;
  cta: NewsletterCtaConfig;
};

export type NewsletterPersonalization = {
  contact_name: string;
  company_name: string;
  area: string;
  unsubscribe_url: string;
};

export type RenderedNewsletter = {
  html: string;
  text: string;
};
