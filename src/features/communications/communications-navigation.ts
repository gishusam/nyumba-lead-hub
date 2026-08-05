export type CommunicationsNavigationItem = {
  label: string;
  to: string;
  enabled: boolean;
};

export const communicationsNavigation = [
  {
    label: "Overview",
    to: "/communications",
    enabled: true,
  },
  {
    label: "Cold Outreach",
    to: "/communications/outreach",
    enabled: false,
  },
  {
    label: "Follow-ups",
    to: "/communications/follow-ups",
    enabled: false,
  },
  {
    label: "Newsletters",
    to: "/communications/newsletters",
    enabled: false,
  },
  {
    label: "Templates",
    to: "/communications/templates",
    enabled: false,
  },
  {
    label: "Automations",
    to: "/communications/automations",
    enabled: false,
  },
  {
    label: "Sender Settings",
    to: "/communications/senders",
    enabled: false,
  },
] as const satisfies readonly CommunicationsNavigationItem[];
