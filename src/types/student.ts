export type Gender = "Male" | "Female";

export type Class = "AIDS" | "IOT" | "CS";

export type Section = "A" | "B" | "";

export type ClassSection = "AIDS A" | "AIDS B" | "IOT A" | "IOT B" | "CS";

export type Choice = "Placement" | "Higher Studies" | "Placement Exempt";

export type Status = "Placed" | "Not Placed" | "Hold" | "Dropped" | "LOR Issued";

export type OfferType =
  | "Regular"
  | "Dream"
  | "Super Dream"
  | "Marquee"
  | "Internship";

export interface Offer {
  company: string;
  ctc: number;
  offerType: OfferType;
  offerDate: string | null;
  offCampus: boolean;
}

/** Joined student record (Master + Offer Details) */
export interface StudentRecord {
  rollNo: string;
  regNo: string;
  name: string;
  gender: Gender;
  class: Class;
  section: Section;
  classSection: ClassSection;
  choice: Choice;
  status: Status;
  companies: string[];
  offers: Offer[];
  bestOffer: Offer | null;
}

/** Anonymized record (no roll/reg/name) for non-admin views */
export interface AnonymizedStudentRecord {
  gender: Gender;
  class: Class;
  section: Section;
  classSection: ClassSection;
  choice: Choice;
  status: Status;
  offers: Offer[];
  bestOffer: Offer | null;
}
