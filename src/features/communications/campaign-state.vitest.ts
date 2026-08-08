import { describe, expect, it } from "vitest";
import {
  buildRecipientFilter,
  canContinueFromReview,
  createCampaignDraft,
  personalizePreview,
  setAudienceFilter,
} from "./campaign-state";

describe("communications campaign state", () => {
  it("builds only supported audience filters", () => {
    let state = createCampaignDraft();
    state = setAudienceFilter(state, "area", "Kilimani");
    state = setAudienceFilter(state, "lead_type", "agency");

    expect(buildRecipientFilter(state)).toEqual({
      area: "Kilimani",
      lead_type: "agency",
    });
  });

  it("blocks progress until the audience review is explicitly accepted", () => {
    const state = {
      ...createCampaignDraft(),
      review: {
        matched: 47,
        invalid: 2,
        unsubscribed: 3,
        duplicates: 1,
        ready: 41,
        accepted: false,
      },
    };

    expect(canContinueFromReview(state)).toBe(false);
    expect(
      canContinueFromReview({
        ...state,
        review: { ...state.review, accepted: true },
      }),
    ).toBe(true);
  });

  it("invalidates an accepted review when an audience filter changes", () => {
    const reviewed = {
      ...createCampaignDraft(),
      filters: { area: "Kilimani" },
      review: {
        matched: 10,
        invalid: 0,
        unsubscribed: 0,
        duplicates: 0,
        ready: 10,
        accepted: true,
      },
    };

    const changed = setAudienceFilter(reviewed, "lead_type", "agency");
    expect(changed.review).toBeNull();
  });

  it("does not accept a review with zero ready recipients", () => {
    const state = {
      ...createCampaignDraft(),
      review: {
        matched: 3,
        invalid: 1,
        unsubscribed: 1,
        duplicates: 1,
        ready: 0,
        accepted: true,
      },
    };

    expect(canContinueFromReview(state)).toBe(false);
  });

  it("personalises supported campaign merge fields", () => {
    expect(
      personalizePreview(
        "Hi {contact_name}, join our event in {area}. — {company_name}",
        {
          contact_name: "John",
          company_name: "ABC Properties",
          area: "Kilimani",
        },
      ),
    ).toBe("Hi John, join our event in Kilimani. — ABC Properties");
  });
});
