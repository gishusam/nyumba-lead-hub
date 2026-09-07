import type {
  CampaignDraftState,
  ResolvedRecipient,
} from "./types";

export function AudienceReview({
  state,
  recipients,
  onChange,
}: {
  state: CampaignDraftState;
  recipients: ResolvedRecipient[];
  onChange: (state: CampaignDraftState) => void;
}) {
  if (!state.review) return null;

  const review = state.review;

  const stats = [
    ["Matched leads", review.matched],
    ["Missing email", review.missing_email],
    ["Invalid email", review.invalid],
    ["Duplicates", review.duplicates],
    ["Ready for preview", review.ready],
  ];

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <span className="font-semibold">Live lead data.</span>{" "}
        These recipients come from your current Leads API. Global
        unsubscribe/suppression checking is not connected in this
        frontend branch yet, so sending remains disabled.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="text-xs text-muted-foreground">
              {label}
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">
              Review matched recipients
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Valid unique email addresses from the selected lead filters.
            </p>
          </div>

          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
            Suppression check pending
          </span>
        </div>

        <div className="max-h-[430px] overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="sticky top-0 bg-muted/95 text-muted-foreground backdrop-blur">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">
                  Lead type
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {recipients.map((recipient) => (
                <tr key={`${recipient.id}-${recipient.email}`}>
                  <td className="px-5 py-4 font-medium">
                    {recipient.contact_name}
                  </td>
                  <td className="px-4 py-4">
                    {recipient.company_name}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {recipient.email}
                  </td>
                  <td className="px-4 py-4">
                    {recipient.area}
                  </td>
                  <td className="px-4 py-4 capitalize">
                    {recipient.lead_type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <label className="flex cursor-pointer items-start gap-3 border-t border-border p-5">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={review.accepted}
            onChange={(event) =>
              onChange({
                ...state,
                review: {
                  ...review,
                  accepted: event.target.checked,
                },
              })
            }
          />

          <span>
            <span className="block text-sm font-medium">
              I reviewed these matched recipients and want to continue composing.
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              This does not authorize sending. A backend suppression
              check and final confirmation are still required.
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
