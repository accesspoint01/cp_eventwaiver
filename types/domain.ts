export type EventAudience = "adults" | "minors";

export type Event = {
  id: string;
  name: string;
  company_name: string | null;
  third_party_name: string | null;
  event_date: string;
  slug: string;
  is_active: boolean;
  waiver_version: string;
  guardian_waiver_version: string | null;
  audience: EventAudience;
  risk_clause: string | null;
  // Deprecated: superseded by `audience`; kept in the DB for compatibility
  // with older deployed code and no longer read by this app.
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
  | "guardian_waiver_version"
  | "audience"
  | "risk_clause"
>;

export type SignerType = "adult" | "guardian";

// For signer_type = 'guardian', first_name/last_name/full_name are the
// MINOR participant and the guardian_* fields are the adult who signed.
export type WaiverSignature = {
  id: string;
  event_id: string;
  signer_type: SignerType;
  first_name: string;
  last_name: string;
  full_name: string;
  guardian_first_name: string | null;
  guardian_last_name: string | null;
  guardian_relationship: "padre" | "madre" | "tutor" | null;
  has_medical_info: boolean | null;
  medical_info: string | null;
  email: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  accepted_liability: boolean;
  accepted_image_use: boolean;
  reviewed_confirmation: boolean;
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
  kind: "adult" | "guardian";
  created_at: string;
};
