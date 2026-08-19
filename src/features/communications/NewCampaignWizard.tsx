import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  canContinueFromAudience,
  canContinueFromBasics,
  canContinueFromCompose,
  canContinueFromReview,
  createCampaignDraft,
} from "./campaign-state";
import { resolveLeadAudience } from "./communications-audience";
import type {
  CampaignDraftState,
  ResolvedRecipient,
} from "./types";
import { CampaignTypeStep } from "./CampaignTypeStep";
import { AudienceBuilder } from "./AudienceBuilder";
import { AudienceReview } from "./AudienceReview";
import { CampaignComposer } from "./CampaignComposer";
import { EmailPreview } from "./EmailPreview";

type WizardStep =
  | "basics"
  | "audience"
  | "review"
  | "compose"
  | "preview";

const steps: {
  id: WizardStep;
  label: string;
}[] = [
  { id: "basics", label: "Basics" },
  { id: "audience", label: "Audience" },
  { id: "review", label: "Review" },
  { id: "compose", label: "Compose" },
  { id: "preview", label: "Preview" },
];

export function NewCampaignWizard() {
  const [step, setStep] =
    useState<WizardStep>("basics");

  const [state, setState] =
    useState<CampaignDraftState>(
      () => createCampaignDraft(),
    );

  const [recipients, setRecipients] =
    useState<ResolvedRecipient[]>([]);

  const [previewRecipientIndex, setPreviewRecipientIndex] =
    useState(0);

  const [resolving, setResolving] =
    useState(false);

  const [resolveError, setResolveError] =
    useState<string | null>(null);

  const stepIndex = steps.findIndex(
    (item) => item.id === step,
  );

  const enterReview = async () => {
    setResolving(true);
    setResolveError(null);

    try {
      if (state.audienceSource === "csv") {
        if (!state.csvSummary || recipients.length === 0) {
          throw new Error(
            "Upload a CSV with at least one valid recipient.",
          );
        }

        setPreviewRecipientIndex(0);

        setState({
          ...state,
          review: {
            matched: state.csvSummary.uploaded,
            missing_email: 0,
            invalid: state.csvSummary.invalid,
            duplicates: state.csvSummary.duplicates,
            unsubscribed: null,
            ready: recipients.length,
            accepted: false,
          },
        });

        setStep("review");
        return;
      }

      const result = await resolveLeadAudience(
        state.filters,
      );

      setRecipients(result.recipients);
      setPreviewRecipientIndex(0);
      setState({
        ...state,
        review: result.summary,
      });
      setStep("review");
    } catch (error) {
      console.error(error);

      setResolveError(
        error instanceof Error
          ? error.message
          : "Could not resolve this audience. Please try again.",
      );
    } finally {
      setResolving(false);
    }
  };

  const continueDisabled =
    (step === "basics" &&
      !canContinueFromBasics(state)) ||
    (step === "audience" &&
      !canContinueFromAudience(state)) ||
    (step === "review" &&
      !canContinueFromReview(state)) ||
    (step === "compose" &&
      !canContinueFromCompose(state));

  const goNext = async () => {
    if (step === "basics") {
      setStep("audience");
    } else if (step === "audience") {
      await enterReview();
    } else if (step === "review") {
      setStep("compose");
    } else if (step === "compose") {
      setStep("preview");
    }
  };

  const goBack = () => {
    if (step === "audience") {
      setStep("basics");
    } else if (step === "review") {
      setStep("audience");
    } else if (step === "compose") {
      setStep("review");
    } else if (step === "preview") {
      setStep("compose");
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
            Interactive frontend
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            New Campaign
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Build a campaign from real lead filters,
            review recipients, compose and preview before
            sending is enabled.
          </p>
        </div>

        <Button variant="ghost" size="sm" asChild>
          <Link to="/communications">
            <X className="h-4 w-4" />
            Close
          </Link>
        </Button>
      </header>

      <ol className="grid gap-2 sm:grid-cols-5">
        {steps.map((item, index) => {
          const active = item.id === step;
          const complete = index < stepIndex;

          return (
            <li
              key={item.id}
              className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 ${
                active
                  ? "border-primary bg-primary/5"
                  : complete
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-border bg-card"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : complete
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {complete ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  index + 1
                )}
              </span>

              <span className="truncate text-xs font-medium">
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      {step === "basics" && (
        <CampaignTypeStep
          state={state}
          onChange={setState}
        />
      )}

      {step === "audience" && (
        <>
          <AudienceBuilder
            state={state}
            onChange={setState}
            onCsvRecipients={setRecipients}
          />

          {resolveError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {resolveError}
            </div>
          )}
        </>
      )}

      {step === "review" && (
        <AudienceReview
          state={state}
          recipients={recipients}
          onChange={setState}
        />
      )}

      {step === "compose" && (
        <CampaignComposer
          state={state}
          onChange={setState}
        />
      )}

      {step === "preview" &&
        recipients[previewRecipientIndex] && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Recipient
                </span>

                <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold">
                  {previewRecipientIndex + 1} of {recipients.length}
                </span>
              </div>

              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={previewRecipientIndex === 0}
                  onClick={() =>
                    setPreviewRecipientIndex((current) =>
                      Math.max(0, current - 1),
                    )
                  }
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    previewRecipientIndex ===
                    recipients.length - 1
                  }
                  onClick={() =>
                    setPreviewRecipientIndex((current) =>
                      Math.min(
                        recipients.length - 1,
                        current + 1,
                      ),
                    )
                  }
                >
                  Next recipient
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <EmailPreview
              state={state}
              recipient={recipients[previewRecipientIndex]}
              recipients={recipients}
            />
          </div>
        )}

      <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {step !== "basics" && (
            <Button
              variant="outline"
              onClick={goBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {step !== "preview" ? (
          <Button
            onClick={() => void goNext()}
            disabled={
              continueDisabled || resolving
            }
          >
            {resolving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resolving recipients…
              </>
            ) : (
              <>
                {step === "audience"
                  ? "Find recipients"
                  : step === "review"
                    ? "Continue to compose"
                    : step === "compose"
                      ? "Preview email"
                      : "Continue"}

                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : null}
      </footer>
    </div>
  );
}
