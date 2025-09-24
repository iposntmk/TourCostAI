import type { ItineraryItem, TourService } from "../types";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

const collectTokens = (item: ItineraryItem) =>
  normalize(`${item.location} ${item.activities.join(" ")}`)
    .split(/\s+/)
    .filter((token) => token.length >= 3);

const matchesTokens = (tokens: string[], service: TourService) => {
  if (!tokens.length) return false;
  const description = normalize(service.description);
  const notes = service.notes ? normalize(service.notes) : "";
  return tokens.some(
    (token) => description.includes(token) || (notes && notes.includes(token)),
  );
};

export const groupServicesByItinerary = (
  itinerary: ItineraryItem[],
  services: TourService[],
): Record<string, TourService[]> => {
  const mapping: Record<string, TourService[]> = {};
  itinerary.forEach((item) => {
    mapping[item.id] = [];
  });

  if (itinerary.length === 0 || services.length === 0) {
    return mapping;
  }

  const unmatched: TourService[] = [];

  services.forEach((service) => {
    const matchedDay = itinerary.find((item) =>
      matchesTokens(collectTokens(item), service),
    );

    if (matchedDay) {
      mapping[matchedDay.id].push(service);
    } else {
      unmatched.push(service);
    }
  });

  if (unmatched.length > 0) {
    unmatched.forEach((service, index) => {
      const target = itinerary[index % itinerary.length];
      mapping[target.id].push(service);
    });
  }

  return mapping;
};
