import { Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NEWSLETTER_TEMPLATES } from "./templates";
import type { NewsletterTemplateKey } from "./types";

export function NewsletterTemplatePicker({
  selected,
  onUse,
}: {
  selected: NewsletterTemplateKey;
  onUse: (template: NewsletterTemplateKey) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {NEWSLETTER_TEMPLATES.map((template) => {
        const active = selected === template.key;
        return (
          <div
            key={template.key}
            className={`rounded-xl border p-4 ${
              active
                ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{template.name}</div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {template.description}
                </p>
              </div>
              {active && (
                <span className="rounded-full bg-primary p-1 text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </div>

            <Button
              type="button"
              variant={active ? "secondary" : "outline"}
              size="sm"
              className="mt-4 w-full"
              onClick={() => onUse(template.key)}
            >
              <Eye className="h-4 w-4" />
              {active ? "Current template" : "Use template"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
