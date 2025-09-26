import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiDownload,
  FiEdit,
  FiFilePlus,
  FiFileText,
  FiInfo,
  FiRefreshCw,
  FiUploadCloud,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { JsonViewer } from "../../components/common/JsonViewer";
import { PromptManager } from "../../components/common/PromptManager";
import { PromptConfirmationModal } from "../../components/common/PromptConfirmationModal";
import { GeminiSuggestionsGrid } from "../../components/common/GeminiSuggestionsGrid";
import { useMasterData } from "../../contexts/MasterDataContext";
import { useTours } from "../../contexts/TourContext";
import { useGeneralOverrides } from "../../contexts/GeneralOverridesContext";
import type {
  Expense,
  ExtractionGeneralInfo,
  ExtractionResult,
  FinancialSummary,
  GeneralOverridePresetInput,
  MatchedService,
  Tour,
  TourService,
} from "../../types";
import {
  formatCurrency,
  formatDate,
  fromInputDateValue,
  toInputDateValue,
} from "../../utils/format";
import {
  buildTourServices,
  matchExtractedServices,
  simulateGeminiExtraction,
} from "../../utils/extraction";
import { extractWithAI, loadApiKey, loadApiMode } from "../../services/aiExtraction";
import { getLatestPrompt } from "../../services/promptService";
import { generateId } from "../../utils/ids";
import { groupServicesByItinerary } from "../../utils/itinerary";

type GeneralOverridesFormState = {
  name: string;
  tourCode: string;
  customerName: string;
  clientCompany: string;
  nationality: string;
  pax: string;
  startDate: string;
  endDate: string;
  guideName: string;
  driverName: string;
  notes: string;
};

const initialFinancialSummary: FinancialSummary = {
  advance: 0,
  collectionsForCompany: 0,
  companyTip: 0,
  totalCost: 0,
  differenceToAdvance: 0,
};

export const NewTourPage = () => {
  const navigate = useNavigate();
  const { masterData, findGuideByName } = useMasterData();
  const { createTour } = useTours();
  const {
    presets: generalOverridePresets,
    isLoading: generalOverridesLoading,
    error: generalOverridesError,
    updatePreset: updateGeneralOverridePreset,
  } = useGeneralOverrides();

  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const customOutputFileInputRef = useRef<HTMLInputElement | null>(null);

  const createInitialGeneral = () => ({
    code: "",
    customerName: "",
    clientCompany: "",
    nationality: masterData.catalogs.nationalities[0] ?? "",
    pax: 0,
    startDate: "",
    endDate: "",
    guideId: "",
    driverName: "",
    notes: "",
  });

  const createInitialGeneralOverrides = (): GeneralOverridesFormState => ({
    name: "",
    tourCode: "",
    customerName: "",
    clientCompany: "",
    nationality: "",
    pax: "",
    startDate: "",
    endDate: "",
    guideName: "",
    driverName: "",
    notes: "",
  });

  const [uploadSource, setUploadSource] = useState<
    { name: string; type: "image" | "json" }
  | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractionNotes, setExtractionNotes] = useState<string | null>(null);
  const [rawExtractionResult, setRawExtractionResult] = useState<ExtractionResult | null>(null);
  const [matches, setMatches] = useState<MatchedService[]>([]);
  const [showPromptManager, setShowPromptManager] = useState(false);
  const [showPromptConfirmation, setShowPromptConfirmation] = useState(false);
  const [showRequestSample, setShowRequestSample] = useState(false);
  const [showOutputSample, setShowOutputSample] = useState(false);
  const [otherExpenses, setOtherExpenses] = useState<Expense[]>([]);
  const [financials, setFinancials] = useState<FinancialSummary>(() => ({
    ...initialFinancialSummary,
  }));
  const [general, setGeneral] = useState(createInitialGeneral);
  const [itinerary, setItinerary] = useState(
    [] as { id: string; day: number; date: string; location: string; activities: string[] }[],
  );
  const [error, setError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [generalOverridesForm, setGeneralOverridesForm] = useState<GeneralOverridesFormState>(
    createInitialGeneralOverrides,
  );
  const [selectedOverrideId, setSelectedOverrideId] = useState<string | null>(null);
  const [useCustomOutput, setUseCustomOutput] = useState(false);
  const [customOutputJsonText, setCustomOutputJsonText] = useState<string>("");
  const [showCustomOutputPreview, setShowCustomOutputPreview] = useState(false);

  useEffect(() => {
    if (generalOverridePresets.length === 0) {
      if (selectedOverrideId !== null) {
        setSelectedOverrideId(null);
      }
      return;
    }

    if (selectedOverrideId === null) {
      setSelectedOverrideId(generalOverridePresets[0].id);
    }
  }, [generalOverridePresets, selectedOverrideId]);

  const selectedOverride = useMemo(
    () =>
      generalOverridePresets.find(
        (preset) => preset.id === (selectedOverrideId ?? ""),
      ),
    [generalOverridePresets, selectedOverrideId],
  );

  const generalOverrides = useMemo<Partial<ExtractionGeneralInfo>>(() => {
    if (!selectedOverride) {
      return {};
    }

    const overrides: Partial<ExtractionGeneralInfo> = {};
    const trimmed = (value?: string | null) => value?.trim() ?? "";

    if (trimmed(selectedOverride.tourCode)) {
      overrides.tourCode = trimmed(selectedOverride.tourCode);
    }
    if (trimmed(selectedOverride.customerName)) {
      overrides.customerName = trimmed(selectedOverride.customerName);
    }
    if (trimmed(selectedOverride.clientCompany)) {
      overrides.clientCompany = trimmed(selectedOverride.clientCompany);
    }
    if (
      typeof selectedOverride.pax === "number" &&
      Number.isFinite(selectedOverride.pax) &&
      selectedOverride.pax > 0
    ) {
      overrides.pax = selectedOverride.pax;
    }
    if (trimmed(selectedOverride.nationality)) {
      overrides.nationality = trimmed(selectedOverride.nationality);
    }
    if (selectedOverride.startDate) {
      overrides.startDate = selectedOverride.startDate;
    }
    if (selectedOverride.endDate) {
      overrides.endDate = selectedOverride.endDate;
    }
    if (trimmed(selectedOverride.guideName)) {
      overrides.guideName = trimmed(selectedOverride.guideName);
    }
    if (trimmed(selectedOverride.driverName)) {
      overrides.driverName = trimmed(selectedOverride.driverName);
    }
    if (trimmed(selectedOverride.notes)) {
      overrides.notes = trimmed(selectedOverride.notes);
    }

    return overrides;
  }, [selectedOverride]);

  useEffect(() => {
    if (!selectedOverride) {
      setGeneralOverridesForm(createInitialGeneralOverrides());
      return;
    }

    setGeneralOverridesForm({
      name: selectedOverride.name ?? "",
      tourCode: selectedOverride.tourCode ?? "",
      customerName: selectedOverride.customerName ?? "",
      clientCompany: selectedOverride.clientCompany ?? "",
      nationality: selectedOverride.nationality ?? "",
      pax:
        typeof selectedOverride.pax === "number" && !Number.isNaN(selectedOverride.pax)
          ? String(selectedOverride.pax)
          : "",
      startDate: toInputDateValue(selectedOverride.startDate ?? ""),
      endDate: toInputDateValue(selectedOverride.endDate ?? ""),
      guideName: selectedOverride.guideName ?? "",
      driverName: selectedOverride.driverName ?? "",
      notes: selectedOverride.notes ?? "",
    });
  }, [selectedOverride]);

  const generalOverrideCount = useMemo(
    () => Object.keys(generalOverrides).length,
    [generalOverrides],
  );
  useEffect(() => {
    if (!uploadSource) {
      setExtractionNotes(null);
      setRawExtractionResult(null);
      setImagePreview(null);
      setShowVerification(false);
      return;
    }

    if (uploadSource.type === "json") {
      setImagePreview(null);
    }
  }, [uploadSource]);

  useEffect(
    () => () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    },
    [imagePreview],
  );

  const resetFormState = () => {
    setGeneral(createInitialGeneral());
    setMatches([]);
    setItinerary([]);
    setOtherExpenses([]);
    setFinancials({ ...initialFinancialSummary });
    setRawExtractionResult(null);
    setShowVerification(false);
    setGeneralOverridesForm(createInitialGeneralOverrides());
  };

  const isExtractionResult = (value: unknown): value is ExtractionResult => {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Partial<ExtractionResult>;
    return (
      !!candidate.general &&
      typeof candidate.general === "object" &&
      Array.isArray(candidate.services) &&
      Array.isArray(candidate.itinerary) &&
      Array.isArray(candidate.otherExpenses)
    );
  };

  const isTour = (value: unknown): value is Tour => {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Partial<Tour>;
    return (
      !!candidate.general &&
      typeof candidate.general === "object" &&
      Array.isArray(candidate.itinerary) &&
      Array.isArray(candidate.services) &&
      Array.isArray(candidate.perDiem) &&
      Array.isArray(candidate.otherExpenses) &&
      !!candidate.financials
    );
  };

  const applyExtraction = (
    extraction: ExtractionResult,
    options?: { note?: string },
  ) => {
    setRawExtractionResult(extraction);
    const matchedGuide = findGuideByName(extraction.general.guideName);
    setMatches(matchExtractedServices(extraction, masterData));
    setGeneral({
      code: extraction.general.tourCode,
      customerName: extraction.general.customerName,
      clientCompany: extraction.general.clientCompany ?? "",
      nationality: extraction.general.nationality,
      pax: extraction.general.pax,
      startDate: extraction.general.startDate,
      endDate: extraction.general.endDate,
      guideId: matchedGuide?.id ?? "",
      driverName: extraction.general.driverName,
      notes: extraction.general.notes ?? "",
    });
    setOtherExpenses(
      extraction.otherExpenses.map((expense) => ({
        id: generateId(),
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        notes: expense.notes,
      })),
    );
    setFinancials({
      advance: extraction.advance ?? 0,
      collectionsForCompany: extraction.collectionsForCompany ?? 0,
      companyTip: extraction.companyTip ?? 0,
      totalCost: 0,
      differenceToAdvance: 0,
    });
    setItinerary(
      extraction.itinerary.map((item) => ({
        id: generateId(),
        day: item.day,
        date: item.date,
        location: item.location,
        activities: item.activities,
      })),
    );
    const message = options?.note ?? createExtractionMessage(extraction);
    setExtractionNotes(message);
    setShowVerification(true);
  };

  const createExtractionMessage = (extraction: ExtractionResult): string => {
    const servicesCount = extraction.services.length;
    const itineraryCount = extraction.itinerary.length;
    const expensesCount = extraction.otherExpenses.length;
    const hasGeneralInfo = extraction.general.tourCode || extraction.general.customerName || extraction.general.pax > 0;
    
    const parts: string[] = [];
    
    if (hasGeneralInfo) {
      parts.push("thông tin chung tour");
    }
    if (servicesCount > 0) {
      parts.push(`${servicesCount} dịch vụ`);
    }
    if (itineraryCount > 0) {
      parts.push(`${itineraryCount} ngày lịch trình`);
    }
    if (expensesCount > 0) {
      parts.push(`${expensesCount} chi phí khác`);
    }
    
    if (parts.length === 0) {
      return "⚠️ Gemini đã xử lý hình ảnh nhưng không trích xuất được thông tin có ý nghĩa. Vui lòng kiểm tra chất lượng hình ảnh hoặc thử hình ảnh khác.";
    }
    
    const message = `✅ Google Gemini đã trích xuất thành công: ${parts.join(", ")} từ chương trình đã tải lên.`;
    
    if (servicesCount === 0 && itineraryCount === 0) {
      return message + " ⚠️ Lưu ý: Không có dịch vụ hoặc lịch trình được trích xuất. Có thể cần kiểm tra lại prompt hoặc chất lượng hình ảnh.";
    }
    
    return message;
  };

  const corrections = useMemo(
    () => matches.filter((item) => Math.abs(item.discrepancy) > 0),
    [matches],
  );

  const previewServiceGroups = useMemo(() => {
    if (!itinerary.length || !matches.length) {
      return {} as Record<string, TourService[]>;
    }
    const previewServices: TourService[] = matches.map((match, index) => ({
      id: `${match.service?.id ?? "candidate"}-${index}`,
      serviceId: match.service?.id ?? `candidate-${index}`,
      description: match.service?.name ?? match.candidate.rawName,
      quantity: match.candidate.quantity,
      unitPrice: match.normalizedPrice,
      sourcePrice: match.candidate.price,
      discrepancy: match.normalizedPrice - match.candidate.price,
      notes: match.service?.description ?? match.candidate.notes,
    }));
    return groupServicesByItinerary(itinerary, previewServices);
  }, [itinerary, matches]);

  const handleRunExtraction = () => {
    if (uploadSource?.type !== "image") return;
    
    const apiMode = loadApiMode();
    if (apiMode === "live") {
      // Show confirmation modal for live mode
      setShowPromptConfirmation(true);
    } else {
      // Run directly for mock mode
      executeExtraction();
    }
  };

  const executeExtraction = async () => {
    setProcessing(true);
    setError(null);

    try {
      const apiMode = loadApiMode();
      const apiKey = loadApiKey();
      const overridesToUse =
        selectedOverrideId && selectedOverrideId !== "" && generalOverrideCount
          ? generalOverrides
          : undefined;

      let extraction: ExtractionResult;

      if (apiMode === "live" && apiKey) {
        // Use real Gemini AI with latest prompt
        const file = imageInputRef.current?.files?.[0];
        if (!file) {
          throw new Error("Không tìm thấy tệp hình ảnh để xử lý");
        }

        // Get latest prompt from Firebase
        const latestPrompt = await getLatestPrompt();
        // Determine which prompt to use
        let promptToUse: string | undefined = latestPrompt?.content;
        if (useCustomOutput) {
          if (!parsedCustomOutput) {
            throw new Error("JSON output tùy chỉnh không hợp lệ hoặc chưa được nạp.");
          }
          promptToUse = buildPromptWithCustomOutput(parsedCustomOutput);
        }
        
        extraction = await extractWithAI(
          file,
          masterData,
          apiKey,
          promptToUse,
          overridesToUse,
        );
      } else {
        // Use mock data
        await new Promise((r) => setTimeout(r, 900));
        extraction = simulateGeminiExtraction(masterData, overridesToUse);
      }

      applyExtraction(extraction);
    } catch (error) {
      console.error("Extraction failed:", error);
      setError(error instanceof Error ? error.message : "Có lỗi xảy ra khi trích xuất dữ liệu");
      setRawExtractionResult(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadSource({ name: file.name, type: "image" });
    setError(null);
    setExtractionNotes(null);
    setRawExtractionResult(null);
    setShowVerification(false);
    if (file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return previewUrl;
      });
    } else {
      setImagePreview(null);
    }
  };

  const handleJsonImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const noteParts: string[] = [];
      let extractionToApply: ExtractionResult | null = null;

      const importTour = async (tourData: Tour) => {
        await createTour({
          general: tourData.general,
          itinerary: tourData.itinerary,
          services: tourData.services,
          perDiem: tourData.perDiem,
          otherExpenses: tourData.otherExpenses,
          financials: tourData.financials,
        });
      };

      if (Array.isArray(parsed)) {
        const toursInFile = parsed.filter(isTour) as Tour[];
        const extractionsInFile = parsed.filter(isExtractionResult) as ExtractionResult[];

        if (toursInFile.length > 0) {
          for (const tourData of toursInFile) {
            await importTour(tourData);
          }
          resetFormState();
          noteParts.push(`${toursInFile.length} tour đã được thêm vào hệ thống`);
        }

        if (extractionsInFile.length > 0) {
          extractionToApply = extractionsInFile[0];
        }
      } else if (isTour(parsed)) {
        await importTour(parsed);
        resetFormState();
        noteParts.push(
          parsed.general?.code
            ? `Tour ${parsed.general.code} đã được thêm vào hệ thống`
            : "1 tour đã được thêm vào hệ thống",
        );
      } else if (isExtractionResult(parsed)) {
        extractionToApply = parsed;
      }

      if (!noteParts.length && !extractionToApply) {
        throw new Error("Unsupported JSON format");
      }

      setUploadSource({ name: file.name, type: "json" });
      setError(null);

      if (extractionToApply) {
        const messagePrefix = noteParts.length
          ? `${noteParts.join(". ")}. `
          : "";
        applyExtraction(extractionToApply, {
          note: `${messagePrefix}Tệp JSON ${file.name} đã nạp ${extractionToApply.services.length} dịch vụ và ${extractionToApply.itinerary.length} ngày lịch trình vào biểu mẫu kiểm tra.`,
        });
      } else if (noteParts.length) {
        setExtractionNotes(`${noteParts.join(". ")} từ ${file.name}.`);
      }
    } catch (jsonError) {
      console.error("Failed to import tour JSON", jsonError);
      setError("Không thể đọc tệp JSON. Vui lòng kiểm tra định dạng.");
    } finally {
      event.target.value = "";
    }
  };

  const handleReset = () => {
    setUploadSource(null);
    setProcessing(false);
    setError(null);
    setExtractionNotes(null);
    setRawExtractionResult(null);
    setImagePreview(null);
    setShowVerification(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    if (jsonInputRef.current) {
      jsonInputRef.current.value = "";
    }
    resetFormState();
  };

  const updateMatchService = (index: number, next: Partial<MatchedService>) => {
    setMatches((current) =>
      current.map((item, idx) =>
        idx === index
          ? (() => {
              const proposed = { ...item, ...next };
              const normalizedPrice =
                next.normalizedPrice ??
                (next.service ? next.service.price : item.normalizedPrice);
              const finalPrice =
                next.service === undefined && next.normalizedPrice === undefined
                  ? item.candidate.price
                  : normalizedPrice;
              return {
                ...proposed,
                normalizedPrice: finalPrice,
                discrepancy: finalPrice - item.candidate.price,
              };
            })()
          : item,
      ),
    );
  };

  const handleServiceSelect = (index: number, serviceId: string) => {
    if (!serviceId) {
      updateMatchService(index, { service: undefined });
      return;
    }
    const service = masterData.services.find((item) => item.id === serviceId);
    if (!service) return;
    updateMatchService(index, {
      service,
      normalizedPrice: service.price,
    });
  };

  const handleServicePriceChange = (index: number, value: string) => {
    const price = Number(value);
    if (Number.isNaN(price)) return;
    updateMatchService(index, { normalizedPrice: Math.max(0, price) });
  };

  const handleQuantityChange = (index: number, value: string) => {
    const quantity = Number(value);
    if (Number.isNaN(quantity)) return;
    setMatches((current) =>
      current.map((item, idx) =>
        idx === index
          ? {
              ...item,
              candidate: { ...item.candidate, quantity: Math.max(0, quantity) },
              discrepancy: item.normalizedPrice - item.candidate.price,
            }
          : item,
      ),
    );
  };

  const handleExpenseChange = (
    id: string,
    field: keyof Expense,
    value: string,
  ) => {
    setOtherExpenses((current) =>
      current.map((expense) =>
        expense.id === id
          ? {
              ...expense,
              [field]: field === "amount" ? Number(value) : value,
            }
          : expense,
      ),
    );
  };

  const handleAddExpense = () => {
    setOtherExpenses((current) => [
      ...current,
      {
        id: generateId(),
        description: "",
        amount: 0,
        date: general.startDate || new Date().toISOString(),
        notes: "",
      },
    ]);
  };

  const handleRemoveExpense = (id: string) => {
    setOtherExpenses((current) => current.filter((expense) => expense.id !== id));
  };

  const handleCreateTour = async () => {
    if (!general.code.trim()) {
      setError("Yêu cầu nhập mã tour.");
      return;
    }
    if (!general.guideId) {
      setError("Vui lòng phân công hướng dẫn viên.");
      return;
    }
    if (!general.startDate || !general.endDate) {
      setError("Bắt buộc nhập ngày bắt đầu và kết thúc.");
      return;
    }
    setError(null);

    const newTourId = await createTour({
      general: {
        ...general,
        startDate: general.startDate,
        endDate: general.endDate,
      },
      itinerary,
      services: buildTourServices(matches),
      perDiem: [],
      otherExpenses,
      financials,
    });
    navigate(`/tour/${newTourId}`);
  };

  const processingMessage = processing
    ? "Đang gọi Google Gemini và áp dụng các quy tắc từ Dữ liệu chuẩn..."
    : extractionNotes;

  const canConfirm = showVerification && !processing;

  const jsonRequestSample = useMemo(() => {
    const mimeType = imageInputRef.current?.files?.[0]?.type || "image/jpeg";
    return {
      contents: [
        {
          parts: [
            { text: "<<PROMPT_TEXT_HERE>>" },
            {
              inline_data: {
                mime_type: mimeType,
                data: "<<BASE64_IMAGE_DATA>>",
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
      },
    } as const;
  }, [uploadSource]);

  const jsonOutputSample = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return {
      thong_tin_chung: {
        ma_tour: "SGN-DAD-2409",
        ten_cong_ty: "Công ty ABC",
        ten_guide: "Nguyễn Văn A",
        ten_khach: "Trần B",
        quoc_tich_khach: "Việt Nam",
        so_luong_khach: 12,
        ten_lai_xe: "Lê Văn C",
        so_dien_thoai_lai_xe: "0909xxxxxx",
        so_dien_thoai_khach: "0988xxxxxx",
      },
      danh_sach_ngay_tham_quan: [
        {
          ngay_tham_quan: `01/10/${currentYear}`,
          tinh: "Đà Nẵng",
        },
      ],
      danh_sach_dia_diem: [
        { dia_diem_tham_quan: "Ngũ Hành Sơn" },
        { dia_diem_tham_quan: "Bà Nà Hills" },
      ],
      danh_sach_chi_phi: [
        { ten_chi_phi: "Vé tham quan", so_tien_per_pax: 150000 },
        { ten_chi_phi: "Ăn trưa", so_tien_per_pax: 120000 },
      ],
      an: {
        an_trua: [
          { ten_mon: "Cơm gà", so_tien_per_pax: 70000 },
          { ten_mon: "Canh chua", so_tien_per_pax: 50000 },
        ],
        an_toi: [
          { ten_mon: "Mì Quảng", so_tien_per_pax: 80000 },
        ],
      },
      tip: { co_tip: true, so_tien_tip: 300000 },
    } as const;
  }, []);

  const parsedCustomOutput = useMemo(() => {
    try {
      if (!customOutputJsonText.trim()) return null;
      return JSON.parse(customOutputJsonText);
    } catch {
      return null;
    }
  }, [customOutputJsonText]);

  const handleCustomOutputFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setCustomOutputJsonText(text);
      setUseCustomOutput(true);
      setShowCustomOutputPreview(true);
    } finally {
      event.target.value = "";
    }
  };

  const buildPromptWithCustomOutput = (schemaObject: unknown): string => {
    const servicesList = masterData.services.map((s) => `- ${s.name}: ${s.price.toLocaleString()} VND`).join("\n");
    const guidesList = masterData.guides.map((g) => `- ${g.name}`).join("\n");
    const nationalitiesList = masterData.catalogs.nationalities.join(", ");
    const schemaJson = JSON.stringify(schemaObject, null, 2);
    const currentYear = new Date().getFullYear();
    return [
      "Bạn là một hệ thống trích xuất dữ liệu chương trình tour từ hình ảnh (JPG/PNG/PDF) có tiếng Việt có dấu.",
      "CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CÓ GIẢI THÍCH HAY VĂN BẢN THÊM.",
      "Phải bám sát đúng SCHEMA dưới đây: giữ nguyên key, cấu trúc, kiểu dữ liệu.",
      "Nếu không có giá trị: number=0, string=\"\", array=[]. Ngày theo dd/mm/" + currentYear + ".",
      "Hạn chế: KHÔNG thêm trường mới ngoài schema. KHÔNG đổi tên trường.",
      "Danh sách tham chiếu:",
      `- Dịch vụ chuẩn:\n${servicesList}`,
      `- Hướng dẫn viên:\n${guidesList}`,
      `- Quốc tịch: ${nationalitiesList}`,
      "SCHEMA JSON CHÍNH XÁC (ví dụ mẫu, hãy điền dữ liệu trích xuất vào đúng trường):",
      "```json\n" + schemaJson + "\n```",
    ].join("\n\n");
  };

  return (
    <div className="page-wrapper new-tour-page">
      <PageHeader
        title="Tiếp nhận hình ảnh bằng AI"
        description="Tải ảnh chương trình tour và để Gemini trích xuất, chuẩn hóa và xác thực dữ liệu dựa trên các danh mục Dữ liệu chuẩn."
      />
      <div className="layout-two-column">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title with-help">
              <span>
                <FiUploadCloud /> Tải hình ảnh lịch trình
              </span>
              <button
                type="button"
                className="info-tooltip-trigger"
                aria-label="Xem hướng dẫn tải tệp"
              >
                <FiInfo />
                <div className="info-tooltip-panel">
                  <p>
                    Định dạng hỗ trợ: JPG, PNG, PDF. Công cụ AI đọc được tài liệu nhiều trang và nhận diện giá, hướng dẫn viên, dịch vụ cùng ghi chú.
                  </p>
                  <p>
                    Hoặc tải tệp JSON đã chuẩn hóa để thêm tour hàng loạt hoặc điền sẵn dữ liệu kiểm tra trước khi xác nhận.
                  </p>
                  <p>
                    Nhấn nút <strong>Tải JSON mẫu</strong> để tải về ví dụ đúng cấu trúc cho quá trình nhập liệu.
                  </p>
                </div>
              </button>
            </div>
          </div>
          <div className="panel-body upload-zone">
            <label className="upload-dropzone">
              <input
                type="file"
                accept="image/*,application/pdf"
                ref={imageInputRef}
                onChange={handleFileChange}
                hidden
              />
              <FiFilePlus size={36} />
              <span>
                {uploadSource
                  ? uploadSource.type === "json"
                    ? `Đã chọn tệp JSON: ${uploadSource.name}`
                    : `Đã chọn tệp: ${uploadSource.name}`
                  : "Kéo thả hoặc nhấp để chọn hình ảnh chương trình tour"}
              </span>
            </label>
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt={`Xem trước ${uploadSource?.name ?? "tệp đã tải"}`} />
              </div>
            )}
            {generalOverridesLoading && (
              <div className="info-banner">
                <FiRefreshCw className="spin" /> Đang tải gợi ý thông tin chung...
              </div>
            )}
            {generalOverridesError && (
              <div className="error-banner">
                <FiAlertTriangle /> Không thể tải gợi ý thông tin chung. Vui lòng thử lại sau.
              </div>
            )}
            <GeminiSuggestionsGrid
              suggestions={generalOverrides}
              onUpdateSuggestions={(suggestions) => {
                // Convert suggestions to form state
                const newFormState: GeneralOverridesFormState = {
                  name: generalOverridesForm.name || "",  // Keep existing name
                  tourCode: suggestions.tourCode || "",
                  customerName: suggestions.customerName || "",
                  clientCompany: suggestions.clientCompany || "",
                  nationality: suggestions.nationality || "",
                  pax: suggestions.pax?.toString() || "",
                  startDate: suggestions.startDate ? toInputDateValue(suggestions.startDate) : "",
                  endDate: suggestions.endDate ? toInputDateValue(suggestions.endDate) : "",
                  guideName: suggestions.guideName || "",
                  driverName: suggestions.driverName || "",
                  notes: suggestions.notes || "",
                };
                setGeneralOverridesForm(newFormState);

                // Persist to Firestore if a preset is selected
                if (selectedOverrideId) {
                  const updates: Partial<GeneralOverridePresetInput> = {};
                  if (typeof suggestions.tourCode === "string") updates.tourCode = suggestions.tourCode.trim();
                  if (typeof suggestions.customerName === "string") updates.customerName = suggestions.customerName.trim();
                  if (typeof suggestions.clientCompany === "string") updates.clientCompany = suggestions.clientCompany.trim();
                  if (typeof suggestions.nationality === "string") updates.nationality = suggestions.nationality.trim();
                  if (typeof suggestions.pax === "number" && Number.isFinite(suggestions.pax)) {
                    updates.pax = suggestions.pax;
                  } else if (suggestions.pax === undefined) {
                    updates.pax = null;
                  }
                  if (typeof suggestions.startDate === "string") updates.startDate = suggestions.startDate;
                  if (typeof suggestions.endDate === "string") updates.endDate = suggestions.endDate;
                  if (typeof suggestions.guideName === "string") updates.guideName = suggestions.guideName.trim();
                  if (typeof suggestions.driverName === "string") updates.driverName = suggestions.driverName.trim();
                  if (typeof suggestions.notes === "string") updates.notes = suggestions.notes.trim();

                  void updateGeneralOverridePreset(selectedOverrideId, updates).catch(() => {
                    // Non-blocking: ignore UI error, user can retry
                  });
                }
              }}
              masterData={masterData}
            />
            <div className="upload-actions sticky-actions">
              <button
                className="primary-button"
                disabled={uploadSource?.type !== "image" || processing}
                onClick={handleRunExtraction}
                type="button"
              >
                {processing ? <FiRefreshCw className="spin" /> : <FiUploadCloud />} Chạy trích xuất Gemini
              </button>
              <button
                className="ghost-button"
                onClick={() => setShowPromptManager(!showPromptManager)}
                type="button"
              >
                <FiEdit /> Quản lý Prompts
              </button>
              <button
                className={`ghost-button${useCustomOutput ? " active" : ""}`}
                type="button"
                onClick={() => setUseCustomOutput((v) => !v)}
                title="Bật/tắt dùng JSON output tùy chỉnh thay vì prompt chuẩn"
              >
                {useCustomOutput ? "Đang dùng JSON output tùy chỉnh" : "Dùng JSON output tùy chỉnh"}
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => customOutputFileInputRef.current?.click()}
                title="Nạp tệp JSON schema output tuỳ chỉnh"
              >
                <FiFileText /> Nhập JSON output tùy chỉnh
              </button>
              <input
                ref={customOutputFileInputRef}
                type="file"
                accept="application/json"
                hidden
                onChange={handleCustomOutputFile}
              />
              <button
                className="ghost-button"
                type="button"
                onClick={() => setShowCustomOutputPreview((v) => !v)}
                disabled={!customOutputJsonText}
              >
                {showCustomOutputPreview ? "Ẩn JSON output tùy chỉnh" : "Xem JSON output tùy chỉnh"}
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setShowRequestSample((v) => !v)}
              >
                {showRequestSample ? "Ẩn mẫu JSON request" : "Xem mẫu JSON request"}
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setShowOutputSample((v) => !v)}
              >
                {showOutputSample ? "Ẩn mẫu JSON output" : "Xem mẫu JSON output"}
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => jsonInputRef.current?.click()}
              >
                <FiFileText /> Nhập JSON
              </button>
              <input
                ref={jsonInputRef}
                type="file"
                accept="application/json"
                hidden
                onChange={handleJsonImport}
              />
              <a
                className="ghost-button"
                href="/samples/tour-import-sample.json"
                download="tour-import-sample.json"
              >
                <FiDownload /> Tải JSON mẫu
              </a>
              {(uploadSource || matches.length > 0 || itinerary.length > 0 || otherExpenses.length > 0) && (
                <button className="ghost-button" type="button" onClick={handleReset}>
                  Đặt lại
                </button>
              )}
            </div>
            {processingMessage && (
              <div className="info-banner">
                {processing ? <FiRefreshCw className="spin" /> : <FiCheckCircle />} {processingMessage}
              </div>
            )}
            {showCustomOutputPreview && customOutputJsonText && (
              <div className="json-result-section">
                <JsonViewer
                  data={parsedCustomOutput ?? { error: "JSON không hợp lệ" }}
                  title="JSON output tùy chỉnh (schema)"
                  defaultExpanded={false}
                />
              </div>
            )}
            {showRequestSample && (
              <div className="json-result-section">
                <JsonViewer
                  data={jsonRequestSample}
                  title="Mẫu JSON request gửi tới Gemini"
                  defaultExpanded={false}
                />
              </div>
            )}
            {showOutputSample && (
              <div className="json-result-section">
                <JsonViewer
                  data={jsonOutputSample}
                  title="Mẫu JSON output mong đợi từ Gemini"
                  defaultExpanded={false}
                />
              </div>
            )}
            {corrections.length > 0 && !processing && (
              <div className="warning-banner">
                <FiAlertTriangle /> {corrections.length} dịch vụ đã được cập nhật để khớp với giá chuẩn trong Dữ liệu chuẩn.
              </div>
            )}
            {error && (
              <div className="error-banner">
                <FiAlertTriangle /> {error}
                <div className="error-actions">
                  <button
                    className="ghost-button small"
                    onClick={handleRunExtraction}
                    disabled={processing || uploadSource?.type !== "image"}
                  >
                    <FiRefreshCw /> Thử lại
                  </button>
                </div>
              </div>
            )}
            
            {/* Prompt Manager */}
            {showPromptManager && (
              <div className="prompt-manager-section">
                <PromptManager onPromptChange={() => {}} />
              </div>
            )}

            {/* JSON Result Display */}
            {rawExtractionResult && !processing && (
              <div className="json-result-section">
                <JsonViewer 
                  data={rawExtractionResult} 
                  title="Kết quả trích xuất từ Gemini AI"
                  defaultExpanded={false}
                />
              </div>
            )}
          </div>
        </div>

        {showVerification ? (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <FiCheckCircle /> Xác minh & làm sạch
            </div>
            <p className="panel-description">
              Kiểm tra lại các giá trị đã chuẩn hóa trước khi lưu tour vào hệ thống vận hành.
            </p>
          </div>
          <div className="panel-body">
            <div className="form-grid">
              <label>
                <span>Mã tour</span>
                <input
                  value={general.code}
                  onChange={(event) =>
                    setGeneral((current) => ({ ...current, code: event.target.value }))
                  }
                  placeholder="vd: SGN-DAD-2406"
                />
              </label>
              <label>
                <span>Khách hàng</span>
                <input
                  value={general.customerName}
                  onChange={(event) =>
                    setGeneral((current) => ({
                      ...current,
                      customerName: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Công ty khách hàng</span>
                <input
                  value={general.clientCompany}
                  onChange={(event) =>
                    setGeneral((current) => ({
                      ...current,
                      clientCompany: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Quốc tịch</span>
                <select
                  value={general.nationality}
                  onChange={(event) =>
                    setGeneral((current) => ({
                      ...current,
                      nationality: event.target.value,
                    }))
                  }
                >
                  {masterData.catalogs.nationalities.map((nationality) => (
                    <option key={nationality} value={nationality}>
                      {nationality}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Số khách</span>
                <input
                  type="number"
                  min={0}
                  value={general.pax}
                  onChange={(event) =>
                    setGeneral((current) => ({
                      ...current,
                      pax: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                <span>Hướng dẫn viên</span>
                <select
                  value={general.guideId}
                  onChange={(event) =>
                    setGeneral((current) => ({
                      ...current,
                      guideId: event.target.value,
                    }))
                  }
                >
                  <option value="">Chọn hướng dẫn viên</option>
                  {masterData.guides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Tài xế</span>
                <input
                  value={general.driverName}
                  onChange={(event) =>
                    setGeneral((current) => ({
                      ...current,
                      driverName: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Ngày bắt đầu</span>
                <input
                  type="date"
                  value={toInputDateValue(general.startDate)}
                  onChange={(event) =>
                    setGeneral((current) => ({
                      ...current,
                      startDate: fromInputDateValue(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                <span>Ngày kết thúc</span>
                <input
                  type="date"
                  value={toInputDateValue(general.endDate)}
                  onChange={(event) =>
                    setGeneral((current) => ({
                      ...current,
                      endDate: fromInputDateValue(event.target.value),
                    }))
                  }
                />
              </label>
            </div>
            <label className="full-width">
              <span>Ghi chú vận hành</span>
              <textarea
                rows={3}
                value={general.notes}
                onChange={(event) =>
                  setGeneral((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </label>

            <h3 className="section-title">Dịch vụ do AI phát hiện</h3>
            <div className="table-responsive">
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Dịch vụ nguồn</th>
                    <th>Khớp Dữ liệu chuẩn</th>
                    <th>SL</th>
                    <th>Giá trong tài liệu</th>
                    <th>Giá chuẩn</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, index) => (
                    <tr key={match.candidate.rawName + index}>
                      <td>
                        <div className="table-primary">
                          <div className="table-title">{match.candidate.rawName}</div>
                          {match.candidate.notes && (
                            <div className="table-subtitle">{match.candidate.notes}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          value={match.service?.id ?? ""}
                          onChange={(event) =>
                            handleServiceSelect(index, event.target.value)
                          }
                        >
                          <option value="">Không khớp</option>
                          {masterData.services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={match.candidate.quantity}
                          onChange={(event) =>
                            handleQuantityChange(index, event.target.value)
                          }
                        />
                      </td>
                      <td>{match.candidate.price.toLocaleString("vi-VN")}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={match.normalizedPrice}
                          onChange={(event) =>
                            handleServicePriceChange(index, event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <span
                          className={`tag ${
                            Math.abs(match.discrepancy) > 0.5 ? "warning" : "success"
                          }`}
                        >
                          {Math.abs(match.discrepancy) > 0.5
                            ? `Chênh lệch ${match.discrepancy.toLocaleString("vi-VN")}`
                            : "Khớp"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {itinerary.length > 0 && (
              <div className="itinerary-preview">
                <h3 className="section-title">Xem trước lịch trình</h3>
                <ul>
                  {itinerary.map((item) => {
                    const dayServices = previewServiceGroups[item.id] ?? [];
                    return (
                      <li key={item.id}>
                        <div className="itinerary-preview-day">
                          <div className="itinerary-preview-header">
                            <span className="badge">Ngày {item.day}</span>
                            <span>{formatDate(item.date)}</span>
                          </div>
                          <div className="itinerary-preview-body">
                            <strong>{item.location}</strong>
                            <p>{item.activities.join(", ")}</p>
                          </div>
                          <div className="day-services">
                            <div className="day-services-header">
                              <span className="day-section-label">Dịch vụ</span>
                              <span className="day-services-count">{dayServices.length} mục</span>
                            </div>
                            {dayServices.length > 0 ? (
                              <ul className="day-services-list">
                                {dayServices.map((service) => {
                                  const discrepancy = service.discrepancy ?? 0;
                                  const sourcePrice = service.sourcePrice ?? service.unitPrice;
                                  return (
                                    <li key={service.id} className="day-service-item" tabIndex={0}>
                                      <div className="day-service-row">
                                        <span>{service.description}</span>
                                        <span className="service-meta">
                                          {service.quantity} × {formatCurrency(service.unitPrice)}
                                        </span>
                                      </div>
                                      <div className="service-tooltip">
                                        <p>Giá tài liệu: {formatCurrency(sourcePrice)}</p>
                                        <p>Giá chuẩn: {formatCurrency(service.unitPrice)}</p>
                                        {service.notes && <p>{service.notes}</p>}
                                        {discrepancy !== 0 && (
                                          <p>
                                            Chênh lệch:{" "}
                                            <strong>{formatCurrency(discrepancy)}</strong>
                                          </p>
                                        )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="empty-services">Chưa có dịch vụ khớp cho ngày này.</p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <h3 className="section-title">Chi phí khác</h3>
            <div className="table-responsive">
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Mô tả</th>
                    <th>Số tiền (VND)</th>
                    <th>Ngày</th>
                    <th>Ghi chú</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {otherExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>
                        <input
                          value={expense.description}
                          onChange={(event) =>
                            handleExpenseChange(expense.id, "description", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={expense.amount}
                          onChange={(event) =>
                            handleExpenseChange(expense.id, "amount", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={toInputDateValue(expense.date)}
                          onChange={(event) =>
                            handleExpenseChange(expense.id, "date", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={expense.notes ?? ""}
                          onChange={(event) =>
                            handleExpenseChange(expense.id, "notes", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="ghost-button"
                          onClick={() => handleRemoveExpense(expense.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="ghost-button" onClick={handleAddExpense}>
              Thêm chi phí
            </button>

            <h3 className="section-title">Tổng kết tài chính</h3>
            <div className="form-grid">
              <label>
                <span>Tạm ứng</span>
                <input
                  type="number"
                  min={0}
                  value={financials.advance}
                  onChange={(event) =>
                    setFinancials((current) => ({
                      ...current,
                      advance: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                <span>Thu hộ công ty</span>
                <input
                  type="number"
                  min={0}
                  value={financials.collectionsForCompany}
                  onChange={(event) =>
                    setFinancials((current) => ({
                      ...current,
                      collectionsForCompany: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                <span>Tiền tip công ty</span>
                <input
                  type="number"
                  min={0}
                  value={financials.companyTip}
                  onChange={(event) =>
                    setFinancials((current) => ({
                      ...current,
                      companyTip: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <div className="form-footer">
              <button
                className="primary-button"
                disabled={!canConfirm}
                onClick={handleCreateTour}
              >
                Xác nhận và tạo tour
              </button>
            </div>
          </div>
        </div>
        ) : (
          <div className="panel verification-placeholder">
            <div className="panel-body">
              <div className="placeholder-message">
                <FiInfo />
                <div>
                  <strong>Chạy Gemini để mở bước xác minh.</strong>
                  <p>
                    Sau khi AI hoàn tất trích xuất, biểu mẫu này sẽ xuất hiện để bạn rà soát dữ liệu và lưu tour vào hệ thống.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Confirmation Modal */}
      <PromptConfirmationModal
        isOpen={showPromptConfirmation}
        onClose={() => setShowPromptConfirmation(false)}
        onConfirm={executeExtraction}
        isProcessing={processing}
      />
    </div>
  );
};
