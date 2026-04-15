export interface VisaType {
  type: string;
  label: string;
  duration: string;
  fee: number;
}

export interface VisaCountry {
  code: string;
  name: string;
  flag: string;
  continent: string;
  visaTypes: VisaType[];
  processingDays: number;
  fee: number;
  currency: string;
  requiredDocuments: string[];
  maxStay: string;
  validity: string;
  isFeatured: boolean;
}

export const visaCountries: VisaCountry[] = [
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    continent: "Asia",
    visaTypes: [
      { type: "tourist_30", label: "Tourist Visa - 30 Days", duration: "30 days", fee: 2800 },
      { type: "tourist_60", label: "Tourist Visa - 60 Days", duration: "60 days", fee: 4500 },
      { type: "transit", label: "Transit Visa - 96 Hours", duration: "96 hours", fee: 1200 },
    ],
    processingDays: 3,
    fee: 2800,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "bank_statement", "hotel_booking", "return_ticket"],
    maxStay: "30 days",
    validity: "60 days",
    isFeatured: true,
  },
  {
    code: "VN",
    name: "Vietnam",
    flag: "🇻🇳",
    continent: "Asia",
    visaTypes: [
      { type: "tourist_30_single", label: "Tourist Visa - 30 Days Single Entry", duration: "30 days", fee: 1800 },
      { type: "tourist_30_multiple", label: "Tourist Visa - 30 Days Multiple Entry", duration: "30 days", fee: 2500 },
      { type: "tourist_90_multiple", label: "Tourist Visa - 90 Days Multiple Entry", duration: "90 days", fee: 3500 },
    ],
    processingDays: 2,
    fee: 1800,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "hotel_booking", "return_ticket"],
    maxStay: "30 days",
    validity: "90 days",
    isFeatured: true,
  },
  {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    continent: "Asia",
    visaTypes: [
      { type: "tourist_30", label: "Tourist Visa - 30 Days", duration: "30 days", fee: 3500 },
      { type: "business_30", label: "Business Visa - 30 Days", duration: "30 days", fee: 4500 },
    ],
    processingDays: 5,
    fee: 3500,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "bank_statement", "hotel_booking", "return_ticket", "employment_letter"],
    maxStay: "30 days",
    validity: "30 days",
    isFeatured: true,
  },
  {
    code: "MY",
    name: "Malaysia",
    flag: "🇲🇾",
    continent: "Asia",
    visaTypes: [
      { type: "tourist_30", label: "Tourist eVisa - 30 Days", duration: "30 days", fee: 1500 },
      { type: "tourist_60", label: "Tourist eVisa - 60 Days", duration: "60 days", fee: 2200 },
    ],
    processingDays: 3,
    fee: 1500,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "hotel_booking", "return_ticket", "bank_statement"],
    maxStay: "30 days",
    validity: "3 months",
    isFeatured: true,
  },
  {
    code: "TH",
    name: "Thailand",
    flag: "🇹🇭",
    continent: "Asia",
    visaTypes: [
      { type: "tourist_single", label: "Tourist Visa - Single Entry", duration: "60 days", fee: 2000 },
      { type: "tourist_multiple", label: "Tourist Visa - Multiple Entry", duration: "60 days per visit", fee: 4500 },
    ],
    processingDays: 4,
    fee: 2000,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "bank_statement", "hotel_booking", "return_ticket"],
    maxStay: "60 days",
    validity: "6 months",
    isFeatured: true,
  },
  {
    code: "LK",
    name: "Sri Lanka",
    flag: "🇱🇰",
    continent: "Asia",
    visaTypes: [
      { type: "tourist_30", label: "Tourist eVisa - 30 Days", duration: "30 days", fee: 800 },
      { type: "tourist_double", label: "Tourist eVisa - Double Entry", duration: "30 days", fee: 1200 },
    ],
    processingDays: 2,
    fee: 800,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "return_ticket"],
    maxStay: "30 days",
    validity: "6 months",
    isFeatured: true,
  },
  {
    code: "TR",
    name: "Turkey",
    flag: "🇹🇷",
    continent: "Europe",
    visaTypes: [
      { type: "tourist_30", label: "Tourist eVisa - 30 Days", duration: "30 days", fee: 3200 },
      { type: "tourist_90", label: "Tourist eVisa - 90 Days", duration: "90 days", fee: 5000 },
    ],
    processingDays: 3,
    fee: 3200,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "bank_statement", "hotel_booking", "return_ticket"],
    maxStay: "30 days",
    validity: "180 days",
    isFeatured: true,
  },
  {
    code: "ID",
    name: "Indonesia (Bali)",
    flag: "🇮🇩",
    continent: "Asia",
    visaTypes: [
      { type: "tourist_voa", label: "Visa on Arrival - 30 Days", duration: "30 days", fee: 2800 },
      { type: "tourist_evoa", label: "e-Visa on Arrival - 30 Days", duration: "30 days", fee: 3000 },
    ],
    processingDays: 1,
    fee: 2800,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "return_ticket", "hotel_booking"],
    maxStay: "30 days",
    validity: "30 days",
    isFeatured: false,
  },
  {
    code: "KH",
    name: "Cambodia",
    flag: "🇰🇭",
    continent: "Asia",
    visaTypes: [
      { type: "tourist_30", label: "Tourist eVisa - 30 Days", duration: "30 days", fee: 1500 },
    ],
    processingDays: 3,
    fee: 1500,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "return_ticket"],
    maxStay: "30 days",
    validity: "3 months",
    isFeatured: false,
  },
  {
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    continent: "Africa",
    visaTypes: [
      { type: "tourist_single", label: "Single Entry eVisa", duration: "90 days", fee: 5500 },
      { type: "east_africa", label: "East Africa Tourist Visa", duration: "90 days", fee: 7500 },
    ],
    processingDays: 3,
    fee: 5500,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "bank_statement", "hotel_booking", "return_ticket", "yellow_fever"],
    maxStay: "90 days",
    validity: "3 months",
    isFeatured: false,
  },
  {
    code: "OM",
    name: "Oman",
    flag: "🇴🇲",
    continent: "Asia",
    visaTypes: [
      { type: "tourist_10", label: "Tourist eVisa - 10 Days", duration: "10 days", fee: 1800 },
      { type: "tourist_30", label: "Tourist eVisa - 30 Days", duration: "30 days", fee: 2500 },
    ],
    processingDays: 4,
    fee: 1800,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "hotel_booking", "return_ticket"],
    maxStay: "30 days",
    validity: "60 days",
    isFeatured: false,
  },
  {
    code: "EG",
    name: "Egypt",
    flag: "🇪🇬",
    continent: "Africa",
    visaTypes: [
      { type: "tourist_30", label: "Tourist eVisa - 30 Days Single", duration: "30 days", fee: 3200 },
      { type: "tourist_multiple", label: "Tourist eVisa - Multiple Entry", duration: "30 days per visit", fee: 5000 },
    ],
    processingDays: 5,
    fee: 3200,
    currency: "INR",
    requiredDocuments: ["passport_copy", "photo", "hotel_booking", "return_ticket", "bank_statement"],
    maxStay: "30 days",
    validity: "3 months",
    isFeatured: false,
  },
];

export function getCountryByCode(code: string): VisaCountry | undefined {
  return visaCountries.find((c) => c.code === code);
}
