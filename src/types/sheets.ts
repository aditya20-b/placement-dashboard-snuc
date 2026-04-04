/** Raw row from "Master" sheet (9 columns) */
export interface MasterSheetRow {
  rollNo: string;
  regNo: string;
  name: string;
  gender: string;
  class: string;
  section: string;
  choice: string;
  status: string;
  company: string;
}

/** Raw row from "Offer Details" sheet (8 columns) */
export interface OfferDetailSheetRow {
  rollNo: string;
  name: string;
  company: string;
  ctcStipend: string;
  offerType: string;
  offerDate: string;
  companyType: string;
  description: string;
}

/** Raw row from "No_Offers_Company" sheet (5 columns) */
export interface NoOfferCompanyRow {
  company: string;
  visitDate: string;
  ctcStipend: string;
  companyType: string;
  description: string;
}
