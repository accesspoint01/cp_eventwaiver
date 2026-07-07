export type Event = {
  id: string;
  name: string;
  company_name: string | null;
  third_party_name: string | null;
  event_date: string;
  slug: string;
  is_active: boolean;
  waiver_version: string;
  risk_clause: string | null;
  includes_minors: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicEventInfo = Pick<
  Event,
  | "id"
  | "name"
  | "company_name"
  | "third_party_name"
  | "event_date"
  | "slug"
  | "is_active"
  | "waiver_version"
  | "risk_clause"
  | "includes_minors"
>;

export type WaiverSignature = {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  accepted_terms: boolean;
  signature_name: string;
  waiver_version: string;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type WaiverTextVersion = {
  version: string;
  body_template: string;
  is_current: boolean;
  created_at: string;
};
