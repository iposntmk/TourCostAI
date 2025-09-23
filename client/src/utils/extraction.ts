import type {
  ExtractionResult,
  MasterData,
  MatchedService,
  TourService,
} from "../types";
import { generateId } from "./ids";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export const simulateGeminiExtraction = (
  _masterData: MasterData,
): ExtractionResult => {
  void _masterData;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 2);

  return {
    general: {
      tourCode: `GEM-${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-0${start.getDate()}`,
      customerName: "Lim Family",
      clientCompany: "Asia Travel Partners",
      pax: 4,
      nationality: "Singapore",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      guideName: "Tu",
      driverName: "Mr. Phuc",
      notes:
        "Client requested vegetarian dinner option on day 2 and VIP queue for Ba Na cable car.",
    },
    services: [
      {
        rawName: "Bana Ticket",
        quantity: 4,
        price: 790_000,
        notes: "VIP lane requested",
      },
      {
        rawName: "Dragon boat Han river",
        quantity: 1,
        price: 1_200_000,
      },
      {
        rawName: "Set menu dinner",
        quantity: 4,
        price: 240_000,
        notes: "Vegetarian",
      },
    ],
    itinerary: [
      {
        day: 1,
        date: start.toISOString(),
        location: "Da Nang",
        activities: ["Airport pickup", "Marble Mountain visit", "Han River cruise"],
      },
      {
        day: 2,
        date: new Date(start.getTime() + 86400000).toISOString(),
        location: "Ba Na Hills",
        activities: ["Cable car", "Fantasy Park", "Golden Bridge"],
      },
      {
        day: 3,
        date: end.toISOString(),
        location: "Hoi An",
        activities: ["Ancient town walking tour", "Lantern workshop", "Dinner at Green Garden"],
      },
    ],
    otherExpenses: [
      {
        description: "Bottled water for guests",
        amount: 120_000,
        date: start.toISOString(),
      },
      {
        description: "Parking fee at Marble Mountain",
        amount: 50_000,
        date: start.toISOString(),
      },
    ],
    advance: 6_000_000,
    collectionsForCompany: 3_500_000,
    companyTip: 300_000,
  };
};

export const matchExtractedServices = (
  extraction: ExtractionResult,
  masterData: MasterData,
): MatchedService[] =>
  extraction.services.map((candidate) => {
    const normalizedName = normalize(candidate.rawName);
    const matched = masterData.services.find((service) =>
      normalize(service.name).includes(normalizedName),
    );
    const normalizedPrice = matched?.price ?? candidate.price;
    return {
      candidate,
      service: matched,
      normalizedPrice,
      discrepancy: normalizedPrice - candidate.price,
    };
  });

export const buildTourServices = (matches: MatchedService[]): TourService[] =>
  matches.map(({ candidate, service, normalizedPrice }) => ({
    id: generateId(),
    serviceId: service?.id ?? generateId(),
    description: service?.name ?? candidate.rawName,
    quantity: candidate.quantity,
    unitPrice: normalizedPrice,
    sourcePrice: candidate.price,
    discrepancy: normalizedPrice - candidate.price,
    notes: candidate.notes,
  }));
