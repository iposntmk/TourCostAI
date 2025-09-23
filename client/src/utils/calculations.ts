import type {
  Expense,
  FinancialSummary,
  ItineraryItem,
  MasterData,
  PerDiemEntry,
  TourService,
} from "../types";
import { generateId } from "./ids";

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const normalizeNumber = (value: number | undefined) =>
  Number.isFinite(value) && value !== undefined ? Math.max(0, Number(value)) : 0;

export const calculateServiceTotal = (services: TourService[]) =>
  sum(services.map((service) => service.unitPrice * service.quantity));

export const calculateOtherExpenseTotal = (expenses: Expense[]) =>
  sum(expenses.map((expense) => expense.amount));

export const calculatePerDiemTotal = (entries: PerDiemEntry[]) =>
  sum(entries.map((entry) => entry.total));

const normalizeLocation = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export const calculatePerDiemEntries = (
  itinerary: ItineraryItem[],
  guideId: string,
  masterData: MasterData,
): PerDiemEntry[] => {
  if (!guideId) return [];
  const dayCounts = new Map<string, number>();

  itinerary.forEach((item) => {
    const key = normalizeLocation(item.location);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  });

  return Array.from(dayCounts.entries()).map(([locationKey, days]) => {
    const match = masterData.perDiemRates.find(
      (rate) => normalizeLocation(rate.location) === locationKey,
    );
    const rateAmount = match?.rate ?? 0;
    return {
      id: generateId(),
      guideId,
      location: match?.location ?? locationKey,
      days,
      rate: rateAmount,
      total: days * rateAmount,
    };
  });
};

export const normalizeFinancialSummary = (
  financials: FinancialSummary,
  services: TourService[],
  perDiem: PerDiemEntry[],
  otherExpenses: Expense[],
): FinancialSummary => {
  const normalizedAdvance = normalizeNumber(financials.advance);
  const normalizedCollections = normalizeNumber(financials.collectionsForCompany);
  const normalizedTip = normalizeNumber(financials.companyTip);

  const serviceTotal = calculateServiceTotal(services);
  const perDiemTotal = calculatePerDiemTotal(perDiem);
  const miscTotal = calculateOtherExpenseTotal(otherExpenses);
  const totalCost = serviceTotal + perDiemTotal + miscTotal;

  const differenceToAdvance =
    normalizedAdvance + normalizedCollections - (totalCost + normalizedTip);

  return {
    advance: normalizedAdvance,
    collectionsForCompany: normalizedCollections,
    companyTip: normalizedTip,
    totalCost,
    differenceToAdvance,
  };
};
