export const PREVIEW_CAMPAIGNS = [
  {
    id: "preview-1",
    name: "Kilimani Agency Event",
    type: "newsletter",
    audience: 41,
    status: "draft",
    sent: 0,
    date: "Not sent",
  },
  {
    id: "preview-2",
    name: "Product Demo Outreach",
    type: "cold_outreach",
    audience: 32,
    status: "sent",
    sent: 32,
    date: "Preview",
  },
  {
    id: "preview-3",
    name: "Customer Product Update",
    type: "newsletter",
    audience: 156,
    status: "sent",
    sent: 154,
    date: "Preview",
  },
] as const;

export const KILIMANI_AGENCY_REVIEW = {
  matched: 47,
  invalid: 2,
  unsubscribed: 3,
  duplicates: 1,
  ready: 41,
  recipients: [
    {
      id: "preview-r1",
      contact_name: "John Mwangi",
      company_name: "ABC Properties",
      email: "john@example.com",
      area: "Kilimani",
      lead_type: "agency",
    },
    {
      id: "preview-r2",
      contact_name: "Grace Wanjiku",
      company_name: "HomePoint Ltd",
      email: "grace@example.com",
      area: "Kilimani",
      lead_type: "agency",
    },
    {
      id: "preview-r3",
      contact_name: "David Otieno",
      company_name: "Urban Spaces",
      email: "david@example.com",
      area: "Kilimani",
      lead_type: "agency",
    },
  ],
} as const;
