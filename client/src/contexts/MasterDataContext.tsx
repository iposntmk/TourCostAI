import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { defaultMasterData, MASTER_DATA_STORAGE_KEY } from "../data/masterData";
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
}

const MasterDataContext = createContext<MasterDataContextValue | undefined>(
  undefined,
);

const loadMasterData = (): MasterData => {
  if (typeof window === "undefined") {
    return defaultMasterData;
  }
  try {
    const raw = window.localStorage.getItem(MASTER_DATA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MasterData;
      if (parsed?.services && parsed?.guides) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Failed to read master data from storage", error);
  }
  return defaultMasterData;
};

const saveMasterData = (data: MasterData) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      MASTER_DATA_STORAGE_KEY,
      JSON.stringify(data),
    );
  } catch (error) {
    console.warn("Failed to persist master data", error);
  }
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export const MasterDataProvider = ({ children }: { children: ReactNode }) => {
  const [masterData, setMasterData] = useState<MasterData>(() => loadMasterData());

  useEffect(() => {
    saveMasterData(masterData);
  }, [masterData]);

  const addService = (service: Omit<Service, "id">) => {
    setMasterData((current) => ({
      ...current,
      services: [...current.services, { ...service, id: generateId() }],
    }));
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setMasterData((current) => ({
      ...current,
      services: current.services.map((service) =>
        service.id === id ? { ...service, ...updates, id } : service,
      ),
    }));
  };

  const removeService = (id: string) => {
    setMasterData((current) => ({
      ...current,
      services: current.services.filter((service) => service.id !== id),
    }));
  };

  const addGuide = (guide: Omit<Guide, "id">) => {
    setMasterData((current) => ({
      ...current,
      guides: [...current.guides, { ...guide, id: generateId() }],
    }));
  };

  const updateGuide = (id: string, updates: Partial<Guide>) => {
    setMasterData((current) => ({
      ...current,
      guides: current.guides.map((guide) =>
        guide.id === id ? { ...guide, ...updates, id } : guide,
      ),
    }));
  };

  const removeGuide = (id: string) => {
    setMasterData((current) => ({
      ...current,
      guides: current.guides.filter((guide) => guide.id !== id),
    }));
  };

  const addPartner = (partner: Omit<Partner, "id">) => {
    setMasterData((current) => ({
      ...current,
      partners: [...current.partners, { ...partner, id: generateId() }],
    }));
  };

  const updatePartner = (id: string, updates: Partial<Partner>) => {
    setMasterData((current) => ({
      ...current,
      partners: current.partners.map((partner) =>
        partner.id === id ? { ...partner, ...updates, id } : partner,
      ),
    }));
  };

  const removePartner = (id: string) => {
    setMasterData((current) => ({
      ...current,
      partners: current.partners.filter((partner) => partner.id !== id),
    }));
  };

  const addPerDiemRate = (rate: Omit<PerDiemRate, "id">) => {
    setMasterData((current) => ({
      ...current,
      perDiemRates: [...current.perDiemRates, { ...rate, id: generateId() }],
    }));
  };

  const updatePerDiemRate = (id: string, updates: Partial<PerDiemRate>) => {
    setMasterData((current) => ({
      ...current,
      perDiemRates: current.perDiemRates.map((rate) =>
        rate.id === id ? { ...rate, ...updates, id } : rate,
      ),
    }));
  };

  const removePerDiemRate = (id: string) => {
    setMasterData((current) => ({
      ...current,
      perDiemRates: current.perDiemRates.filter((rate) => rate.id !== id),
    }));
  };

  const addNationality = (nationality: string) => {
    const normalized = nationality.trim();
    if (!normalized) return;
    setMasterData((current) => {
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
  };

  const addServiceType = (type: string) => {
    const normalized = type.trim();
    if (!normalized) return;
    setMasterData((current) => {
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
  };

  const resetMasterData = () => {
    setMasterData(defaultMasterData);
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

  const value: MasterDataContextValue = {
    masterData,
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
