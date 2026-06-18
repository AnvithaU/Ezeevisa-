export type VisaDocument = {
  id: string;
  title: string;
  description: string;
};

export const VISA_REQUIREMENTS: Record<string, { documents: VisaDocument[] }> =
  {
    AE: {
      // UAE
      documents: [
        {
          id: "passport_photo",
          title: "Passport Size Photo",
          description: "Clear photo with white background",
        },
        {
          id: "hotel_booking",
          title: "Proof of Accommodation",
          description: "Hotel voucher or booking confirmation",
        },
        {
          id: "flight_ticket",
          title: "Flight Tickets",
          description: "Confirmed onward and return tickets",
        },
        {
          id: "travel_insurance",
          title: "Overseas Travel Insurance",
          description: "Valid travel insurance policy",
        },
      ],
    },
    VN: {
      // Vietnam
      documents: [
        {
          id: "passport_photo",
          title: "Passport Photos",
          description: "Two 4x6 cm photos (white background)",
        },
        {
          id: "flight_ticket",
          title: "Proof of Travel",
          description: "Confirmed return or onward tickets",
        },
        {
          id: "hotel_booking",
          title: "Accommodation Details",
          description: "Hotel vouchers or temporary stay address",
        },
        {
          id: "bank_statement",
          title: "Financial Proof",
          description: "Bank statements covering the last 3 months",
        },
      ],
    },
    SG: {
      // Singapore
      documents: [
        {
          id: "visa_form",
          title: "Visa Application Form 14A",
          description: "Completely filled out and signed",
        },
        {
          id: "passport_photo",
          title: "Passport Photographs",
          description: "2-3 recent colored photos (white background)",
        },
        {
          id: "flight_ticket",
          title: "Confirmed Travel Itinerary",
          description: "Return or onward flight tickets",
        },
        {
          id: "hotel_booking",
          title: "Hotel Accommodation",
          description: "Proof of reserved lodging",
        },
        {
          id: "bank_statement",
          title: "Bank Statements",
          description: "Last 6 months (Min INR 80k balance recommended)",
        },
        {
          id: "salary_slips",
          title: "Salary Slips",
          description: "Most recent 3 months",
        },
        {
          id: "cover_letter",
          title: "Cover Letter",
          description: "Signed letter detailing purpose of travel",
        },
        {
          id: "loi",
          title: "Letter of Introduction (LOI)",
          description: "If applicable (for specific nationalities)",
        },
      ],
    },
    MY: {
      // Malaysia
      documents: [
        {
          id: "passport_scan",
          title: "Passport Scan",
          description: "Clear picture of front and back pages",
        },
        {
          id: "selfie",
          title: "A Selfie",
          description: "Quick photo of your face",
        },
        {
          id: "flight_ticket",
          title: "Flight Itinerary",
          description: "Confirmed return or onward ticket",
        },
        {
          id: "hotel_booking",
          title: "Accommodation Details",
          description: "Hotel name and physical address",
        },
      ],
    },
    TH: {
      // Thailand
      documents: [
        {
          id: "passport_scan",
          title: "Passport Copy",
          description: "High-quality color scans (front/back)",
        },
        {
          id: "passport_photo",
          title: "Passport Photograph",
          description: "3.5cm x 4.5cm with strict white background",
        },
        {
          id: "flight_ticket",
          title: "Confirmed Flight Tickets",
          description: "Round-trip flight itinerary (exit within 15 days)",
        },
        {
          id: "hotel_booking",
          title: "Hotel Booking",
          description: "Voucher showing accommodation for entire stay",
        },
      ],
    },
    LK: {
      // Sri Lanka
      documents: [
        {
          id: "passport_scan",
          title: "Passport Copy",
          description: "Clear digital photo or scan of bio pages",
        },
        {
          id: "passport_photo",
          title: "Passport Photo",
          description: "Recent passport-sized photograph",
        },
        {
          id: "flight_ticket",
          title: "Travel Dates",
          description: "Intended date of arrival and flight numbers",
        },
        {
          id: "hotel_booking",
          title: "Accommodation Details",
          description: "Hotel or host details in Sri Lanka",
        },
      ],
    },
    TR: {
      // Turkey
      documents: [
        {
          id: "old_passports",
          title: "Old Passports",
          description: "To demonstrate travel history",
        },
        {
          id: "passport_photo",
          title: "Biometric Photos",
          description: "Two copies (2.5x2.5 inches, 80% face coverage)",
        },
        {
          id: "national_id",
          title: "National IDs",
          description: "Photocopies of Aadhaar and PAN Card",
        },
        {
          id: "employment_proof",
          title: "Employment Proof",
          description: "Last 3 months salary slips & NOC",
        },
        {
          id: "business_proof",
          title: "Self-Employed Proof",
          description: "GST/Incorporation & 3 months bank statements",
        },
        {
          id: "bank_statement",
          title: "Financial Proof",
          description: "Original 6-month bank statements (stamped)",
        },
        {
          id: "tax_returns",
          title: "Tax Documents",
          description: "ITR for the last 3 financial years",
        },
        {
          id: "flight_ticket",
          title: "Flight Tickets",
          description: "Round-trip flight tickets",
        },
        {
          id: "hotel_booking",
          title: "Hotel Vouchers",
          description: "Confirmed hotel vouchers",
        },
        {
          id: "cover_letter",
          title: "Cover Letter",
          description: "Signed letter explaining trip purpose",
        },
        {
          id: "travel_insurance",
          title: "Travel Insurance",
          description: "Minimum coverage of €30,000",
        },
      ],
    },
    ID: {
      // Indonesia
      documents: [
        {
          id: "passport_scan",
          title: "Passport Bio-Page",
          description: "High-quality color scan (first & last page)",
        },
        {
          id: "passport_photo",
          title: "Applicant Photo",
          description: "Recent digital photo (plain white background)",
        },
        {
          id: "flight_ticket",
          title: "Return Flight Ticket",
          description: "Confirmed ticket showing departure within 30 days",
        },
      ],
    },
    KH: {
      // Cambodia
      documents: [
        {
          id: "passport_scan",
          title: "Passport Bio-Page",
          description: "Clear color scan (JPEG/PNG, under 2MB)",
        },
        {
          id: "passport_photo",
          title: "Applicant Photograph",
          description: "Digital photo with plain white background",
        },
        {
          id: "flight_ticket",
          title: "Travel Records",
          description: "Flight itinerary (confirmed return ticket)",
        },
        {
          id: "hotel_booking",
          title: "Stay Records",
          description: "Hotel booking confirmation",
        },
      ],
    },
    KE: {
      // Kenya
      documents: [
        {
          id: "passport_scan",
          title: "Passport Scan",
          description: "Color image of front and back pages",
        },
        {
          id: "passport_photo",
          title: "Applicant Photo/Selfie",
          description: "High-resolution photo (plain white background)",
        },
        {
          id: "flight_ticket",
          title: "Flight Itinerary",
          description: "Confirmed round-trip flight booking",
        },
        {
          id: "hotel_booking",
          title: "Accommodation Proof",
          description: "Hotel voucher or invitation letter with host ID",
        },
      ],
    },
    OM: {
      // Oman
      documents: [
        {
          id: "flight_ticket",
          title: "Confirmed Return Ticket",
          description: "Proving exit from Oman within 14 days",
        },
        {
          id: "hotel_booking",
          title: "Hotel Booking",
          description: "Confirmed hotel reservation for entire stay",
        },
        {
          id: "travel_insurance",
          title: "Mandatory Travel Insurance",
          description: "Valid international health insurance",
        },
        {
          id: "bank_statement",
          title: "Proof of Funds",
          description: "Recent bank statements showing sufficient balance",
        },
      ],
    },
    EG: {
      // Egypt
      documents: [
        {
          id: "passport_scan",
          title: "Passport Photocopies",
          description: "Physical photocopies of first and last pages",
        },
        {
          id: "passport_photo",
          title: "Biometric Photos",
          description: "Two copies on white background (60% face visibility)",
        },
        {
          id: "bank_statement",
          title: "Financial Proof",
          description: "Original 6-month statements (stamped & signed)",
        },
        {
          id: "tax_returns",
          title: "Tax Records",
          description: "ITR for the past 3 financial years",
        },
        {
          id: "cover_letter",
          title: "Official Cover Letter",
          description: "Detailed day-wise travel itinerary & purpose",
        },
        {
          id: "agent_itinerary",
          title: "Stamped Agent Itinerary",
          description: "Copy of itinerary on agent's letterhead",
        },
      ],
    },
  };
