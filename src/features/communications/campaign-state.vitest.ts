import { describe, expect, it } from "vitest";
import {
  buildRecipientFilter,
  canContinueFromBasics,
  canContinueFromReview,
  createCampaignDraft,
  personalizePreview,
  setAudienceFilter,
} from "./campaign-state";

describe("communications campaign state", () => {
  it("requires campaign name and type", () => {
    const initial = createCampaignDraft();

    expect(canContinueFromBasics(initial)).toBe(false);
    expect(
      canContinueFromBasics({
        ...initial,
        name: "Kilimani Agency Event",
        campaignType: "newsletter",
      }),
    ).toBe(true);
  });

  it("builds only supported audience filters", () => {
    let state = createCampaignDraft();
    state = setAudienceFilter(state, "area", "Kilimani");
    state = setAudienceFilter(state, "lead_type", "agency");

    expect(buildRecipientFilter(state)).toEqual({
      area: "Kilimani",
      lead_type: "agency",
    });
  });

  it("blocks progress until review is accepted", () => {
    const state = {
      ...createCampaignDraft(),
      review: {
        matched: 47,
        missing_email: 1,
        invalid: 2,
        duplicates: 1,
        unsubscribed: null,
        ready: 43,
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

  it("invalidates review after filter change", () => {
    const reviewed = {
      ...createCampaignDraft(),
      filters: { area: "Kilimani" },
      review: {
        matched: 10,
        missing_email: 0,
        invalid: 0,
        duplicates: 0,
        unsubscribed: null,
        ready: 10,
        accepted: true,
      },
    };

    expect(
      setAudienceFilter(reviewed, "lead_type", "agency").review,
    ).toBeNull();
  });

  it("blocks review with zero ready recipients", () => {
    const state = {
      ...createCampaignDraft(),
      review: {
        matched: 3,
        missing_email: 1,
        invalid: 1,
        duplicates: 1,
        unsubscribed: null,
        ready: 0,
        accepted: true,
      },
    };

    expect(canContinueFromReview(state)).toBe(false);
  });

  it("personalises supported merge fields", () => {
    expect(
      personalizePreview(
        "Hi {contact_name}, join us in {area}. — {company_name}",
        {
          contact_name: "John",
          company_name: "ABC Properties",
          area: "Kilimani",
        },
      ),
    ).toBe("Hi John, join us in Kilimani. — ABC Properties");
  });
});
