import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { defaultMasterData, emptyMasterData } from "../data/masterData";
import { hybridStorage, type SyncStatus } from "../services/hybridStorage";
import { generateId } from "../utils/ids";
import type {
  Guide,
  MasterData,
  Partner,
  PerDiemRate,
  Service,
} from "../types";

export interface MasterDataContextValue {
  masterData: MasterData;
  syncStatus: SyncStatus;
  isLoading: boolean;
  addService: (service: Omit<Service, "id">) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  removeService: (id: string) => void;
  addGuide: (guide: Omit<Guide, "id">) => void;
  updateGuide: (id: string, updates: Partial<Guide>) => void;
  removeGuide: (id: string) => void;
  addPartner: (partner: Omit<Partner, "id">) => void;
  updatePartner: (id: string, updates: Partial<Partner>) => void;
  removePartner: (id: string) => void;
  addPerDiemRate: (rate: Omit<PerDiemRate, "id">) => void;
  updatePerDiemRate: (id: string, updates: Partial<PerDiemRate>) => void;
  removePerDiemRate: (id: string) => void;
  addNationality: (nationality: string) => void;
  addServiceType: (type: string) => void;
  resetMasterData: () => void;
  findServiceByName: (query: string) => Service | undefined;
  findGuideByName: (query: string) => Guide | undefined;
  forceSync: () => Promise<void>;
  clearAllData: () => Promise<void>;
  updateMasterDataBatch: (data: Partial<MasterData>) => void;
  addServicesBatch: (services: Omit<Service, "id">[]) => void;
  addGuidesBatch: (guides: Omit<Guide, "id">[]) => void;
  addPartnersBatch: (partners: Omit<Partner, "id">[]) => void;
  addPerDiemRatesBatch: (rates: Omit<PerDiemRate, "id">[]) => void;
}

const MasterDataContext = createContext<MasterDataContextValue | undefined>(
  undefined,
);

// Helper function to update master data and sync
const updateMasterData = async (
  currentData: MasterData,
  updater: (data: MasterData) => MasterData
): Promise<MasterData> => {
  const newData = updater(currentData);
  await hybridStorage.saveMasterData(newData);
  return newData;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export const MasterDataProvider = ({ children }: { children: ReactNode }) => {
  const [masterData, setMasterData] = useState<MasterData>(emptyMasterData);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingChanges: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const result = await hybridStorage.loadMasterData();
        if (result.data) {
          setMasterData(result.data);
        } else {
          setMasterData(defaultMasterData);
        }
      } catch (error) {
        console.warn("Failed to load master data:", error);
        setMasterData(defaultMasterData); // Fallback to default
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Setup sync status listener
  useEffect(() => {
    const unsubscribe = hybridStorage.onSyncStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  // Start realtime sync
  useEffect(() => {
    hybridStorage.startRealtimeSync();
    return () => {
      hybridStorage.stopRealtimeSync();
    };
  }, []);

  const addService = async (service: Omit<Service, "id">) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      services: [...current.services, { ...service, id: generateId() }],
    }));
    setMasterData(newData);
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      services: current.services.map((service) =>
        service.id === id ? { ...service, ...updates, id } : service,
      ),
    }));
    setMasterData(newData);
  };

  const removeService = async (id: string) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      services: current.services.filter((service) => service.id !== id),
    }));
    setMasterData(newData);
  };

  const addGuide = async (guide: Omit<Guide, "id">) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      guides: [...current.guides, { ...guide, id: generateId() }],
    }));
    setMasterData(newData);
  };

  const updateGuide = async (id: string, updates: Partial<Guide>) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      guides: current.guides.map((guide) =>
        guide.id === id ? { ...guide, ...updates, id } : guide,
      ),
    }));
    setMasterData(newData);
  };

  const removeGuide = async (id: string) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      guides: current.guides.filter((guide) => guide.id !== id),
    }));
    setMasterData(newData);
  };

  const addPartner = async (partner: Omit<Partner, "id">) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      partners: [...current.partners, { ...partner, id: generateId() }],
    }));
    setMasterData(newData);
  };

  const updatePartner = async (id: string, updates: Partial<Partner>) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      partners: current.partners.map((partner) =>
        partner.id === id ? { ...partner, ...updates, id } : partner,
      ),
    }));
    setMasterData(newData);
  };

  const removePartner = async (id: string) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      partners: current.partners.filter((partner) => partner.id !== id),
    }));
    setMasterData(newData);
  };

  const addPerDiemRate = async (rate: Omit<PerDiemRate, "id">) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      perDiemRates: [...current.perDiemRates, { ...rate, id: generateId() }],
    }));
    setMasterData(newData);
  };

  const updatePerDiemRate = async (id: string, updates: Partial<PerDiemRate>) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      perDiemRates: current.perDiemRates.map((rate) =>
        rate.id === id ? { ...rate, ...updates, id } : rate,
      ),
    }));
    setMasterData(newData);
  };

  const removePerDiemRate = async (id: string) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      perDiemRates: current.perDiemRates.filter((rate) => rate.id !== id),
    }));
    setMasterData(newData);
  };

  const addNationality = async (nationality: string) => {
    const normalized = nationality.trim();
    if (!normalized) return;
    const newData = await updateMasterData(masterData, (current) => {
      if (
        current.catalogs.nationalities
          .map((item) => item.toLowerCase())
          .includes(normalized.toLowerCase())
      ) {
        return current;
      }
      return {
        ...current,
        catalogs: {
          ...current.catalogs,
          nationalities: [...current.catalogs.nationalities, normalized],
        },
      };
    });
    setMasterData(newData);
  };

  const addServiceType = async (type: string) => {
    const normalized = type.trim();
    if (!normalized) return;
    const newData = await updateMasterData(masterData, (current) => {
      if (
        current.catalogs.serviceTypes
          .map((item) => item.toLowerCase())
          .includes(normalized.toLowerCase())
      ) {
        return current;
      }
      return {
        ...current,
        catalogs: {
          ...current.catalogs,
          serviceTypes: [...current.catalogs.serviceTypes, normalized],
        },
      };
    });
    setMasterData(newData);
  };

  const resetMasterData = async () => {
    const newData = await updateMasterData(masterData, () => defaultMasterData);
    setMasterData(newData);
  };

  const findServiceByName = (query: string) => {
    if (!query) return undefined;
    const normalized = normalizeText(query);
    return masterData.services.find((service) =>
      normalizeText(service.name).includes(normalized),
    );
  };

  const findGuideByName = (query: string) => {
    if (!query) return undefined;
    const normalized = normalizeText(query);
    return masterData.guides.find((guide) =>
      normalizeText(guide.name).includes(normalized),
    );
  };

  const forceSync = async () => {
    try {
      await hybridStorage.forceSync();
    } catch (error) {
      console.warn("Force sync failed:", error);
      throw error;
    }
  };

  const clearAllData = async () => {
    try {
      await hybridStorage.clearAllData();
      // Reset to empty data after clearing
      setMasterData(emptyMasterData);
    } catch (error) {
      console.warn("Clear all data failed:", error);
      throw error;
    }
  };

  const updateMasterDataBatch = async (data: Partial<MasterData>) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      ...data,
    }));
    setMasterData(newData);
  };

  const addServicesBatch = async (services: Omit<Service, "id">[]) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      services: [
        ...current.services,
        ...services.map(service => ({ ...service, id: generateId() })),
      ],
    }));
    setMasterData(newData);
  };

  const addGuidesBatch = async (guides: Omit<Guide, "id">[]) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      guides: [
        ...current.guides,
        ...guides.map(guide => ({ ...guide, id: generateId() })),
      ],
    }));
    setMasterData(newData);
  };

  const addPartnersBatch = async (partners: Omit<Partner, "id">[]) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      partners: [
        ...current.partners,
        ...partners.map(partner => ({ ...partner, id: generateId() })),
      ],
    }));
    setMasterData(newData);
  };

  const addPerDiemRatesBatch = async (rates: Omit<PerDiemRate, "id">[]) => {
    const newData = await updateMasterData(masterData, (current) => ({
      ...current,
      perDiemRates: [
        ...current.perDiemRates,
        ...rates.map(rate => ({ ...rate, id: generateId() })),
      ],
    }));
    setMasterData(newData);
  };

  const value: MasterDataContextValue = {
    masterData,
    syncStatus,
    isLoading,
    addService,
    updateService,
    removeService,
    addGuide,
    updateGuide,
    removeGuide,
    addPartner,
    updatePartner,
    removePartner,
    addPerDiemRate,
    updatePerDiemRate,
    removePerDiemRate,
    addNationality,
    addServiceType,
    resetMasterData,
    findServiceByName,
    findGuideByName,
    forceSync,
    clearAllData,
    updateMasterDataBatch,
    addServicesBatch,
    addGuidesBatch,
    addPartnersBatch,
    addPerDiemRatesBatch,
  };

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMasterData = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error("useMasterData must be used within a MasterDataProvider");
  }
  return context;
};
