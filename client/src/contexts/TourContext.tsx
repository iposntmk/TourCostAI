import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  calculatePerDiemEntries,
  normalizeFinancialSummary,
} from "../utils/calculations";
import { generateId } from "../utils/ids";
import type { Tour } from "../types";
import { useMasterData } from "./MasterDataContext";

const TOURS_STORAGE_KEY = "tour-cost-ai/tours";

export interface TourContextValue {
  tours: Tour[];
  createTour: (tour: Omit<Tour, "id" | "createdAt" | "updatedAt">) => string;
  updateTour: (id: string, updater: (tour: Tour) => Tour) => void;
  deleteTour: (id: string) => void;
  getTourById: (id: string) => Tour | undefined;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

const loadTours = (): Tour[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TOURS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Tour[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to read tours from storage", error);
  }
  return [];
};

const saveTours = (tours: Tour[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(tours));
  } catch (error) {
    console.warn("Failed to persist tours", error);
  }
};

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const { masterData } = useMasterData();
  const [tours, setTours] = useState<Tour[]>(() => loadTours());

  useEffect(() => {
    saveTours(tours);
  }, [tours]);

  const normalizeTour = (tour: Tour): Tour => {
    const recalculatedPerDiem = calculatePerDiemEntries(
      tour.itinerary,
      tour.general.guideId,
      masterData,
    );
    const recalculatedFinancials = normalizeFinancialSummary(
      tour.financials,
      tour.services,
      recalculatedPerDiem,
      tour.otherExpenses,
    );

    return {
      ...tour,
      perDiem: recalculatedPerDiem,
      financials: recalculatedFinancials,
      updatedAt: new Date().toISOString(),
    };
  };

  const createTour = (tour: Omit<Tour, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const normalizedTour = normalizeTour({
      ...tour,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    });
    setTours((current) => [...current, normalizedTour]);
    return normalizedTour.id;
  };

  const updateTour = (id: string, updater: (tour: Tour) => Tour) => {
    setTours((current) =>
      current.map((tour) =>
        tour.id === id ? normalizeTour(updater(tour)) : tour,
      ),
    );
  };

  const deleteTour = (id: string) => {
    setTours((current) => current.filter((tour) => tour.id !== id));
  };

  const getTourById = (id: string) => tours.find((tour) => tour.id === id);

  return (
    <TourContext.Provider
      value={{ tours, createTour, updateTour, deleteTour, getTourById }}
    >
      {children}
    </TourContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTours = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTours must be used within a TourProvider");
  }
  return context;
};
