export type CommunicationsNavigationItem = {
  label: string;
  to: "/communications" | "/communications/bulk-mail" | "/communications/newsletter";
};

export const communicationsNavigation = [
  { label: "Overview", to: "/communications" },
  { label: "Bulk Mail", to: "/communications/bulk-mail" },
  { label: "Newsletter", to: "/communications/newsletter" },
] as const satisfies readonly CommunicationsNavigationItem[];
