export type Chamber = "shugiin" | "sangiin";
export type UpdateCategory = "news" | "bill";

export interface Party {
  id: string;
  name: string;
  short: string | null;
  leader: string | null;
  founded: string | null;
  color: string | null;
  description: string | null;
  url: string | null;
  seats_note: string | null;
  display_order: number;
}

export interface SeatSnapshot {
  id: string;
  chamber: Chamber;
  party_name: string;
  seats: number;
  total: number;
  note: string | null;
  source: string | null;
  as_of_date: string;
}

export interface PartyUpdate {
  id: string;
  party_id: string | null;
  category: UpdateCategory;
  title: string;
  summary: string;
  source_url: string;
  published_at: string | null;
  created_at: string;
  party?: Pick<Party, "name" | "short" | "color"> | null;
}

export interface Profile {
  id: string;
  email: string | null;
  plan: string;
  created_at: string;
}
