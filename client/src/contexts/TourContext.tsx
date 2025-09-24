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
import {
  deleteTourDocument,
  fetchTours,
  saveTourDocument,
  subscribeToTours,
} from "../services/tourStorage";
import type { Tour } from "../types";
import { useMasterData } from "./MasterDataContext";

const TOURS_STORAGE_KEY = "tour-cost-ai/tours";

export interface TourContextValue {
  tours: Tour[];
  createTour: (tour: Omit<Tour, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updateTour: (id: string, updater: (tour: Tour) => Tour) => Promise<void>;
  deleteTour: (id: string) => Promise<void>;
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

  useEffect(() => {
    let unsubscribe: ReturnType<typeof subscribeToTours> | null = null;
    let isMounted = true;

    const loadFromCloud = async () => {
      try {
        const remoteTours = await fetchTours();
        if (isMounted && remoteTours.length > 0) {
          setTours(remoteTours);
        }
      } catch (error) {
        console.warn("Failed to load tours from Firestore", error);
      }

      unsubscribe = subscribeToTours((remoteTours) => {
        if (isMounted) {
          setTours(remoteTours);
        }
      });
    };

    loadFromCloud();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

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

  const createTour = async (
    tour: Omit<Tour, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> => {
    const existing = tours.find(
      (item) =>
        item.general.code.trim().toLowerCase() ===
        tour.general.code.trim().toLowerCase(),
    );

    const baseTour = existing
      ? {
          ...existing,
          ...tour,
          id: existing.id,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        }
      : {
          ...tour,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    const normalizedTour = normalizeTour(baseTour);

    setTours((current) => {
      if (existing) {
        return current.map((item) =>
          item.id === existing.id ? normalizedTour : item,
        );
      }
      return [...current, normalizedTour];
    });

    try {
      await saveTourDocument(normalizedTour);
    } catch (error) {
      console.warn("Failed to save tour to Firestore", error);
    }
    return normalizedTour.id;
  };

  const updateTour = async (
    id: string,
    updater: (tour: Tour) => Tour,
  ): Promise<void> => {
    let updated: Tour | null = null;
    setTours((current) =>
      current.map((tour) => {
        if (tour.id === id) {
          const normalized = normalizeTour(updater({ ...tour }));
          updated = normalized;
          return normalized;
        }
        return tour;
      }),
    );

    if (updated) {
      try {
        await saveTourDocument(updated);
      } catch (error) {
        console.warn("Failed to update tour in Firestore", error);
      }
    }
  };

  const deleteTour = async (id: string): Promise<void> => {
    const tourToRemove = tours.find((tour) => tour.id === id);
    setTours((current) => current.filter((tour) => tour.id !== id));

    if (tourToRemove) {
      try {
        await deleteTourDocument(tourToRemove.general.code);
      } catch (error) {
        console.warn("Failed to delete tour from Firestore", error);
      }
    }
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
