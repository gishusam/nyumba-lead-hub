import { Newspaper, Send } from "lucide-react";
import type {
  CampaignDraftState,
  CampaignType,
} from "./types";
import { createNewsletterFromTemplate } from "./newsletter/templates";

export function CampaignTypeStep({
  state,
  onChange,
}: {
  state: CampaignDraftState;
  onChange: (state: CampaignDraftState) => void;
}) {
  const options = [
    {
      id: "cold_outreach" as const,
      title: "Cold Outreach",
      description:
        "Target selected prospects with personalised sales outreach and product-demo invitations.",
      icon: Send,
    },
    {
      id: "newsletter" as const,
      title: "Newsletter",
      description:
        "Create branded Nyumba Zetu updates, nurture campaigns and demo-focused HTML emails.",
      icon: Newspaper,
    },
  ];

  const selectType = (campaignType: CampaignType) => {
    const newsletter = campaignType === "newsletter";

    onChange({
      ...state,
      campaignType,
      subject: newsletter
        ? "See how Nyumba Zetu can help {company_name} work smarter"
        : "See how Nyumba Zetu can support {company_name}",
      body: newsletter
        ? state.body
        : "Hi {contact_name},\n\nI’m reaching out from Nyumba Zetu. Our software helps real-estate teams such as {company_name} keep lead management, customer follow-up and everyday workflows better organized.\n\nWould you be open to a short product demo?\n\nRegards,\nNyumba Zetu",
      newsletter: newsletter
        ? state.newsletter ?? createNewsletterFromTemplate("book-demo")
        : state.newsletter,
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">Campaign basics</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Give the campaign a clear internal name, then choose how you want to communicate.
      </p>

      <label className="mt-6 grid max-w-xl gap-2">
        <span className="text-sm font-medium">Campaign name</span>
        <input
          value={state.name}
          onChange={(event) =>
            onChange({ ...state, name: event.target.value })
          }
          placeholder="e.g. Kilimani Agency Product Event"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {options.map((option) => {
          const Icon = option.icon;
          const active = state.campaignType === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => selectType(option.id)}
              className={`rounded-xl border p-5 text-left transition ${
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                  : "border-border hover:border-primary/30 hover:bg-muted/20"
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mt-4 font-semibold">{option.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
