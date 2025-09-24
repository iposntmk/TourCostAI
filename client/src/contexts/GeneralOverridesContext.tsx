import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  GeneralOverridePreset,
  GeneralOverridePresetInput,
} from "../types";
import {
  createGeneralOverride,
  deleteGeneralOverride,
  subscribeToGeneralOverrides,
  updateGeneralOverride,
} from "../services/generalOverrides";

interface GeneralOverridesContextValue {
  presets: GeneralOverridePreset[];
  isLoading: boolean;
  error?: string;
  createPreset: (
    initial?: Partial<GeneralOverridePresetInput>,
  ) => Promise<string>;
  updatePreset: (
    id: string,
    updates: Partial<GeneralOverridePresetInput>,
  ) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  duplicatePreset: (id: string) => Promise<string | null>;
}

const GeneralOverridesContext = createContext<
  GeneralOverridesContextValue | undefined
>(undefined);

const toPresetInput = (
  preset: GeneralOverridePreset,
): GeneralOverridePresetInput => ({
  name: preset.name,
  tourCode: preset.tourCode ?? "",
  customerName: preset.customerName ?? "",
  clientCompany: preset.clientCompany ?? "",
  pax: preset.pax ?? null,
  nationality: preset.nationality ?? "",
  startDate: preset.startDate ?? "",
  endDate: preset.endDate ?? "",
  guideName: preset.guideName ?? "",
  driverName: preset.driverName ?? "",
  notes: preset.notes ?? "",
});

export const GeneralOverridesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [presets, setPresets] = useState<GeneralOverridePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = subscribeToGeneralOverrides(
      (items) => {
        setPresets(items);
        setIsLoading(false);
        setError(undefined);
      },
      (subscriptionError) => {
        setIsLoading(false);
        setError("Không thể tải gợi ý thông tin chung từ Firebase");
        console.warn("General override subscription error", subscriptionError);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const createPreset = async (
    initial?: Partial<GeneralOverridePresetInput>,
  ): Promise<string> => {
    try {
      return await createGeneralOverride(initial);
    } catch (creationError) {
      console.error("Failed to create general override", creationError);
      setError("Không thể tạo gợi ý mới");
      throw creationError;
    }
  };

  const updatePreset = async (
    id: string,
    updates: Partial<GeneralOverridePresetInput>,
  ): Promise<void> => {
    try {
      await updateGeneralOverride(id, updates);
    } catch (updateError) {
      console.error("Failed to update general override", updateError);
      setError("Không thể cập nhật gợi ý");
      throw updateError;
    }
  };

  const deletePreset = async (id: string): Promise<void> => {
    try {
      await deleteGeneralOverride(id);
    } catch (deleteError) {
      console.error("Failed to delete general override", deleteError);
      setError("Không thể xóa gợi ý");
      throw deleteError;
    }
  };

  const duplicatePreset = async (id: string): Promise<string | null> => {
    const preset = presets.find((item) => item.id === id);
    if (!preset) {
      return null;
    }

    const baseName = preset.name?.trim() || "Gợi ý";
    const duplicateName = `${baseName} (bản sao)`;

    try {
      return await createGeneralOverride({
        ...toPresetInput(preset),
        name: duplicateName,
      });
    } catch (duplicateError) {
      console.error("Failed to duplicate general override", duplicateError);
      setError("Không thể nhân bản gợi ý");
      throw duplicateError;
    }
  };

  const value: GeneralOverridesContextValue = {
    presets,
    isLoading,
    error,
    createPreset,
    updatePreset,
    deletePreset,
    duplicatePreset,
  };

  return (
    <GeneralOverridesContext.Provider value={value}>
      {children}
    </GeneralOverridesContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGeneralOverrides = () => {
  const context = useContext(GeneralOverridesContext);
  if (!context) {
    throw new Error(
      "useGeneralOverrides must be used within a GeneralOverridesProvider",
    );
  }
  return context;
};
