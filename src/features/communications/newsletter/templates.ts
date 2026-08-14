import type {
  NewsletterBlock,
  NewsletterDraft,
  NewsletterTemplateKey,
} from "./types";

function id(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

function bookDemoBlocks(): NewsletterBlock[] {
  return [
    {
      id: id("heading"),
      type: "heading",
      text: "Build a better real-estate operation with Nyumba Zetu",
      level: 1,
      align: "left",
    },
    {
      id: id("text"),
      type: "text",
      text:
        "Hi {contact_name}, Nyumba Zetu gives teams like {company_name} one organized system for managing leads, customer follow-up and the day-to-day work that keeps a real-estate business moving.",
      align: "left",
    },
    {
      id: id("features"),
      type: "feature-row",
      items: [
        {
          title: "Stay organized",
          body: "Keep important customer and sales activity in one clear workflow.",
        },
        {
          title: "Follow up faster",
          body: "Give your team better visibility into leads, outreach and next actions.",
        },
        {
          title: "Make smarter decisions",
          body: "Turn operational information into useful reporting instead of scattered files.",
        },
      ],
    },
    {
      id: id("button"),
      type: "button",
      label: "Book a Demo",
      destinationType: "calendar",
      url: "",
      align: "left",
    },
  ];
}

function productUpdateBlocks(): NewsletterBlock[] {
  return [
    {
      id: id("heading"),
      type: "heading",
      text: "What’s new in Nyumba Zetu",
      level: 1,
      align: "left",
    },
    {
      id: id("text"),
      type: "text",
      text:
        "Hi {contact_name}, we’re continuing to improve Nyumba Zetu so real-estate teams can work with less friction and keep customer activity easier to follow.",
      align: "left",
    },
    {
      id: id("image"),
      type: "image",
      url: "",
      alt: "Nyumba Zetu product update",
      align: "center",
      width: 100,
    },
    {
      id: id("features"),
      type: "feature-row",
      items: [
        {
          title: "Clearer workflows",
          body: "Give the team a simpler view of what needs attention next.",
        },
        {
          title: "Better communication",
          body: "Keep outreach and customer communication connected to your work.",
        },
        {
          title: "More useful visibility",
          body: "See the information your team needs without hunting through disconnected tools.",
        },
      ],
    },
    {
      id: id("button"),
      type: "button",
      label: "Learn More",
      destinationType: "landing_page",
      url: "",
      align: "left",
    },
  ];
}

function stayConnectedBlocks(): NewsletterBlock[] {
  return [
    {
      id: id("heading"),
      type: "heading",
      text: "A simpler way to keep your real-estate team moving",
      level: 1,
      align: "left",
    },
    {
      id: id("text"),
      type: "text",
      text:
        "Hi {contact_name}, growing teams often lose time when leads, follow-ups and operational information live in different places. Nyumba Zetu is built to bring that work into one practical system.",
      align: "left",
    },
    {
      id: id("features"),
      type: "feature-row",
      items: [
        {
          title: "One shared view",
          body: "Help the team understand customer activity and ownership at a glance.",
        },
        {
          title: "Less manual chasing",
          body: "Use clearer workflows to keep next actions visible.",
        },
        {
          title: "Built for real-estate teams",
          body: "Keep the system focused on the work your business actually does.",
        },
      ],
    },
    {
      id: id("button"),
      type: "button",
      label: "Talk to Sales",
      destinationType: "whatsapp",
      url: "",
      align: "left",
    },
  ];
}

export function createNewsletterFromTemplate(
  templateKey: NewsletterTemplateKey,
): NewsletterDraft {
  const blocks =
    templateKey === "book-demo"
      ? bookDemoBlocks()
      : templateKey === "product-update"
        ? productUpdateBlocks()
        : stayConnectedBlocks();

  const button = blocks.find((block) => block.type === "button");

  return {
    templateKey,
    blocks,
    htmlSource: "",
    advancedHtmlMode: false,
    headerLocked: true,
    footerLocked: true,
    cta: button && button.type === "button"
      ? {
          destinationType: button.destinationType,
          label: button.label,
          url: button.url,
        }
      : {
          destinationType: "landing_page",
          label: "Learn More",
          url: "",
        },
  };
}

export const NEWSLETTER_TEMPLATES = [
  {
    key: "book-demo" as const,
    name: "Book a Demo",
    description: "Conversion-focused newsletter for demos and sales conversations.",
  },
  {
    key: "product-update" as const,
    name: "Nyumba Zetu Update",
    description: "Share product improvements, feature launches and platform news.",
  },
  {
    key: "stay-connected" as const,
    name: "Stay Connected",
    description: "Nurture leads with useful brand and product messaging.",
  },
];
