export type LeadStatus = "New" | "Called" | "Demo Booked" | "Won" | "Lost" | "Not Qualified";
export type LeadSource = "Apartments" | "Agencies" | "Landlords";

export const AREAS = [
  "Westlands",
  "Kilimani",
  "Kileleshwa",
  "Runda",
  "Karen",
  "Lavington",
  "Parklands",
  "Spring Valley",
  "Riverside",
  "Upper Hill",
];

export const TEAM = ["Brian Otieno", "Wanjiku Mwangi", "Aisha Hassan", "David Kamau"];

export interface Apartment {
  id: string;
  name: string;
  area: string;
  score: number;
  phone: string;
  website: string;
  reviews: number;
  rating: number;
  status: LeadStatus;
  assignedTo: string;
  lastContact: string;
}

export interface Agency {
  id: string;
  company: string;
  areas: string[];
  phone: string;
  website: string;
  score: number;
  listings: number;
  category: "Boutique" | "Mid-Market" | "Enterprise";
  status: LeadStatus;
  assignedTo: string;
}

export interface Landlord {
  id: string;
  name: string;
  phone: string;
  listings: number;
  areas: string[];
  portfolio: "Small" | "Medium" | "Large Portfolio";
  score: number;
  status: LeadStatus;
  assignedTo: string;
}

export interface ActivityEvent {
  id: string;
  when: string;
  who: string;
  action: string;
  target: string;
}

const buildings = [
  "Mirage Heights", "Acacia Court", "Brookside Towers", "The Spring Apartments",
  "Greenpark Residences", "Lavington Place", "Riverside Square", "Karen Estate Villas",
  "Runda Grove", "Parklands Suites", "Westlands Pinnacle", "Kileleshwa Crest",
  "Upper Hill Heights", "Spring Valley Apartments", "Kilimani Skyline",
  "Highridge Residences", "Mvuli Apartments", "Galleria Court", "The Address",
  "Nairobi Skylofts",
];

const agencies = [
  "Hass Consult", "Knight Frank Kenya", "Pam Golding Kenya", "Lloyd Masika",
  "Tysons Limited", "Villa Care", "Axis Real Estate", "Regent Management",
  "Dunhill Consulting", "Crown Plaza Realtors", "Cytonn Real Estate", "Optiven",
];

const landlords = [
  "James Mwangi", "Susan Wambui", "Patrick Otieno", "Faith Njeri",
  "Ali Hassan", "Grace Atieno", "Peter Kamau", "Lucy Wanjiru",
  "Ibrahim Yusuf", "Esther Akinyi", "Daniel Mutua", "Joyce Wairimu",
  "Samuel Karanja", "Mercy Chebet", "Joseph Ndegwa",
];

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
const phone = (i: number) =>
  `+254 7${String(10 + (i % 90))} ${String(100 + ((i * 7) % 900))} ${String(100 + ((i * 13) % 900))}`;
const status = (s: number): LeadStatus => {
  const order: LeadStatus[] = ["New", "Called", "Demo Booked", "Won", "Lost", "Not Qualified"];
  return order[s % order.length];
};

export const apartments: Apartment[] = buildings.map((name, i) => {
  const score = 35 + ((i * 17) % 65);
  return {
    id: `apt-${i + 1}`,
    name,
    area: pick(AREAS, i),
    score,
    phone: phone(i),
    website: `${name.toLowerCase().replace(/\s+/g, "")}.co.ke`,
    reviews: 5 + ((i * 11) % 180),
    rating: Math.round((3 + ((i * 0.37) % 2)) * 10) / 10,
    status: status(i),
    assignedTo: pick(TEAM, i),
    lastContact: `${1 + (i % 14)} days ago`,
  };
});

export const agencyLeads: Agency[] = agencies.map((company, i) => {
  const score = 45 + ((i * 13) % 55);
  return {
    id: `agn-${i + 1}`,
    company,
    areas: [pick(AREAS, i), pick(AREAS, i + 3), pick(AREAS, i + 6)],
    phone: phone(i + 50),
    website: `${company.toLowerCase().replace(/[^a-z]/g, "")}.co.ke`,
    score,
    listings: 8 + ((i * 23) % 240),
    category: (["Boutique", "Mid-Market", "Enterprise"] as const)[i % 3],
    status: status(i + 1),
    assignedTo: pick(TEAM, i + 1),
  };
});

export const landlordLeads: Landlord[] = landlords.map((name, i) => {
  const listings = 1 + ((i * 5) % 24);
  const portfolio: Landlord["portfolio"] =
    listings >= 10 ? "Large Portfolio" : listings >= 4 ? "Medium" : "Small";
  const score =
    portfolio === "Large Portfolio" ? 75 + (i % 25) : portfolio === "Medium" ? 55 + (i % 25) : 30 + (i % 20);
  return {
    id: `lnd-${i + 1}`,
    name,
    phone: phone(i + 200),
    listings,
    areas: [pick(AREAS, i), pick(AREAS, i + 2)],
    portfolio,
    score,
    status: status(i + 2),
    assignedTo: pick(TEAM, i + 2),
  };
});

export const activity: ActivityEvent[] = [
  { id: "a1", when: "2 min ago", who: "Brian Otieno", action: "moved to Demo Booked", target: "Hass Consult" },
  { id: "a2", when: "18 min ago", who: "Wanjiku Mwangi", action: "called", target: "Mirage Heights" },
  { id: "a3", when: "1 hr ago", who: "Aisha Hassan", action: "marked Won", target: "James Mwangi (Landlord)" },
  { id: "a4", when: "3 hr ago", who: "David Kamau", action: "added a note on", target: "Knight Frank Kenya" },
  { id: "a5", when: "Yesterday", who: "Brian Otieno", action: "added new lead", target: "Lavington Place" },
  { id: "a6", when: "Yesterday", who: "Wanjiku Mwangi", action: "booked demo with", target: "Pam Golding Kenya" },
  { id: "a7", when: "2 days ago", who: "Aisha Hassan", action: "lost lead", target: "Tysons Limited" },
];

export const kpis = {
  totalLeads: apartments.length + agencyLeads.length + landlordLeads.length,
  newLeads: 14,
  callsThisWeek: 47,
  demoBooked: 9,
  wonCustomers: 6,
  conversionRate: 12.4,
};

export const leadsBySource = [
  { source: "Apartments", value: apartments.length },
  { source: "Agencies", value: agencyLeads.length },
  { source: "Landlords", value: landlordLeads.length },
];

export const funnel = [
  { stage: "New", value: 38 },
  { stage: "Called", value: 24 },
  { stage: "Demo Booked", value: 14 },
  { stage: "Won", value: 6 },
  { stage: "Lost", value: 5 },
];

export const leadsByArea = AREAS.map((area, i) => ({
  area,
  value: 4 + ((i * 7) % 22),
}));

export const teamPerformance = TEAM.map((name, i) => ({
  name,
  calls: 30 + i * 8,
  demos: 5 + i * 2,
  conversion: 8 + i * 3,
}));

export const sourcePerformance = [
  { source: "Apartments", leads: apartments.length, won: 3, conv: 15 },
  { source: "Agencies", leads: agencyLeads.length, won: 2, conv: 17 },
  { source: "Landlords", leads: landlordLeads.length, won: 1, conv: 7 },
];

export const scoreColor = (s: number) =>
  s >= 80 ? "success" : s >= 50 ? "warning" : "muted";
