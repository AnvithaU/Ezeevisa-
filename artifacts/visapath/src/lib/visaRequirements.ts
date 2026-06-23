export type VisaDocument = {
  id: string;
  title: string;
  description: string;
};

export type CountryConfig = {
  documents: VisaDocument[];
  hiddenFields?: string[]; // Fields to hide (e.g. "occupation", "gender")
  photoBackground: "white" | "blue" | "any"; // Required photo background
};

export const VISA_REQUIREMENTS: Record<string, CountryConfig> = {
  AE: {
    // UAE
    photoBackground: "white",
    documents: [
      {
        id: "passport_photo",
        title: "Passport Photo",
        description: "White background",
      },
      {
        id: "flight_ticket",
        title: "Flight Tickets",
        description: "Onward and return",
      },
    ],
  },
  VN: {
    // Vietnam
    photoBackground: "white",
    hiddenFields: ["occupation", "hotelAddress"], // Vietnam needs fewer details!
    documents: [
      {
        id: "passport_photo",
        title: "Passport Photos",
        description: "White background (4x6 cm)",
      },
      {
        id: "flight_ticket",
        title: "Proof of Travel",
        description: "Return tickets",
      },
    ],
  },
  SG: {
    // Singapore
    photoBackground: "white",
    documents: [
      {
        id: "passport_photo",
        title: "Passport Photograph",
        description: "White background",
      },
      {
        id: "bank_statement",
        title: "Bank Statements",
        description: "Last 6 months",
      },
      {
        id: "salary_slips",
        title: "Salary Slips",
        description: "Last 3 months",
      },
    ],
  },
  MY: {
    // Malaysia
    photoBackground: "white",
    documents: [
      {
        id: "passport_scan",
        title: "Passport Scan",
        description: "Front and back pages",
      },
      {
        id: "hotel_booking",
        title: "Accommodation Details",
        description: "Hotel address",
      },
    ],
  },
  TH: {
    // Thailand
    photoBackground: "white",
    documents: [
      {
        id: "passport_photo",
        title: "Passport Photograph",
        description: "Strict white background (3.5x4.5cm)",
      },
      {
        id: "hotel_booking",
        title: "Hotel Booking",
        description: "Voucher for entire stay",
      },
    ],
  },
  LK: {
    // Sri Lanka
    photoBackground: "white",
    hiddenFields: ["occupation"],
    documents: [
      {
        id: "passport_scan",
        title: "Passport Copy",
        description: "Clear scan of bio pages",
      },
    ],
  },
  TR: {
    // Turkey
    photoBackground: "white",
    documents: [
      {
        id: "passport_photo",
        title: "Biometric Photos",
        description: "White background",
      },
      {
        id: "bank_statement",
        title: "Financial Proof",
        description: "6-month bank statements",
      },
      {
        id: "tax_returns",
        title: "Tax Documents",
        description: "ITR for 3 years",
      },
    ],
  },
  ID: {
    // Indonesia
    photoBackground: "any",
    documents: [
      {
        id: "passport_scan",
        title: "Passport Bio-Page",
        description: "High-quality color scan",
      },
      {
        id: "flight_ticket",
        title: "Return Flight Ticket",
        description: "Departure within 30 days",
      },
    ],
  },
  KH: {
    // Cambodia
    photoBackground: "white",
    documents: [
      {
        id: "passport_scan",
        title: "Passport Bio-Page",
        description: "Clear color scan",
      },
      {
        id: "hotel_booking",
        title: "Stay Records",
        description: "Hotel confirmation",
      },
    ],
  },
  KE: {
    // Kenya
    photoBackground: "white",
    documents: [
      {
        id: "passport_photo",
        title: "Applicant Photo",
        description: "Plain white background",
      },
      {
        id: "flight_ticket",
        title: "Flight Itinerary",
        description: "Round-trip booking",
      },
    ],
  },
  OM: {
    // Oman
    photoBackground: "blue", // Oman frequently accepts/requires blue backgrounds
    documents: [
      {
        id: "hotel_booking",
        title: "Hotel Booking",
        description: "Confirmed reservation",
      },
      {
        id: "travel_insurance",
        title: "Travel Insurance",
        description: "Health insurance",
      },
    ],
  },
  EG: {
    // Egypt
    photoBackground: "white",
    documents: [
      {
        id: "passport_photo",
        title: "Biometric Photos",
        description: "White background",
      },
      {
        id: "bank_statement",
        title: "Financial Proof",
        description: "6-month statements",
      },
    ],
  },
};
