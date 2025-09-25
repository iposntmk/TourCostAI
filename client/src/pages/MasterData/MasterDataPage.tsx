import { useEffect, useRef, useState } from "react";
import { FiDatabase, FiDownload, FiEdit2, FiPlus, FiRefreshCw, FiSave, FiUsers, FiDollarSign, FiList, FiTrash2 } from "react-icons/fi";
import { PageHeader } from "../../components/common/PageHeader";
import { TabMenu } from "../../components/common/TabMenu";
import { SyncStatus } from "../../components/common/SyncStatus";
import { ConfirmationDialog } from "../../components/common/ConfirmationDialog";
import { useMasterData } from "../../contexts/MasterDataContext";
import type { Guide, PerDiemRate, Service } from "../../types";
import { formatCurrency } from "../../utils/format";

interface ServiceFormState {
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
}

interface GuideFormState {
  name: string;
  phone: string;
  email: string;
  languages: string;
}

interface PerDiemFormState {
  location: string;
  rate: number;
  currency: string;
  notes: string;
}

const emptyServiceForm = (defaultCategory = ""): ServiceFormState => ({
  name: "",
  category: defaultCategory,
  price: 0,
  unit: "",
  description: "",
});

const emptyGuideForm = (): GuideFormState => ({
  name: "",
  phone: "",
  email: "",
  languages: "",
});

const emptyPerDiemForm = (): PerDiemFormState => ({
  location: "",
  rate: 0,
  currency: "VND",
  notes: "",
});

const amountFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

const formatAmountInputValue = (value: number) =>
  value > 0 ? amountFormatter.format(value) : "";

const parseAmountInputValue = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly ? Number(digitsOnly) : 0;
};

const AMOUNT_SUGGESTIONS = [50000, 150000, 200000, 220000, 250000] as const;

const formatAmountSuggestionLabel = (value: number) => `${Math.round(value / 1000)}k`;

export const MasterDataPage = () => {
  const {
    masterData,
    addService,
    updateService,
    removeService,
    addGuide,
    updateGuide,
    removeGuide,
    addPerDiemRate,
    updatePerDiemRate,
    removePerDiemRate,
    addNationality,
    addServiceType,
    resetMasterData,
    clearAllData,
  } = useMasterData();

  const serviceTypes = masterData.catalogs.serviceTypes;
  const defaultServiceCategory = serviceTypes[0] ?? "";

  const [serviceForm, setServiceForm] = useState<ServiceFormState>(() =>
    emptyServiceForm(defaultServiceCategory),
  );
  const [guideForm, setGuideForm] = useState<GuideFormState>(emptyGuideForm);
  const [perDiemForm, setPerDiemForm] = useState<PerDiemFormState>(emptyPerDiemForm);

  const serviceNameInputRef = useRef<HTMLInputElement>(null);
  const servicePriceInputRef = useRef<HTMLInputElement>(null);
  const guideNameInputRef = useRef<HTMLInputElement>(null);
  const perDiemLocationInputRef = useRef<HTMLInputElement>(null);
  const perDiemRateInputRef = useRef<HTMLInputElement>(null);

  const editingServiceNameRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const editingServicePriceRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const editingGuideNameRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const editingPerDiemLocationRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const editingPerDiemRateRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [serviceFormErrors, setServiceFormErrors] = useState<{ name: boolean; price: boolean }>({
    name: false,
    price: false,
  });
  const [guideFormNameError, setGuideFormNameError] = useState(false);
  const [perDiemFormErrors, setPerDiemFormErrors] = useState<{
    location: boolean;
    rate: boolean;
  }>({
    location: false,
    rate: false,
  });

  const [editingServiceNameErrorId, setEditingServiceNameErrorId] = useState<string | null>(null);
  const [editingServicePriceErrorId, setEditingServicePriceErrorId] = useState<string | null>(null);
  const [editingGuideNameErrorId, setEditingGuideNameErrorId] = useState<string | null>(null);
  const [editingPerDiemError, setEditingPerDiemError] = useState<{
    id: string;
    field: "location" | "rate";
  } | null>(null);

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [editingPerDiem, setEditingPerDiem] = useState<PerDiemRate | null>(null);
  const [nationality, setNationality] = useState("");
  const [serviceType, setServiceType] = useState("");

  const [activeTab, setActiveTab] = useState("services");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const focusInput = (input: HTMLInputElement | null) => {
    if (!input) return;
    setTimeout(() => {
      input.focus();
      input.setSelectionRange?.(input.value.length, input.value.length);
    }, 0);
  };

  const resetServiceFormErrors = () =>
    setServiceFormErrors({
      name: false,
      price: false,
    });

  const resetPerDiemFormErrors = () =>
    setPerDiemFormErrors({
      location: false,
      rate: false,
    });

  const clearServiceEditingErrors = () => {
    setEditingServiceNameErrorId(null);
    setEditingServicePriceErrorId(null);
  };

  const clearGuideEditingErrors = () => {
    setEditingGuideNameErrorId(null);
  };

  const clearPerDiemEditingErrors = () => {
    setEditingPerDiemError(null);
  };

  useEffect(() => {
    setServiceForm((current) => {
      if (serviceTypes.length === 0) {
        return current.category === "" ? current : { ...current, category: "" };
      }

      if (!current.category || !serviceTypes.includes(current.category)) {
        return { ...current, category: serviceTypes[0] };
      }

      return current;
    });
  }, [serviceTypes]);

  const getServiceTypeOptions = (currentCategory?: string) => {
    if (currentCategory && serviceTypes.includes(currentCategory)) {
      return serviceTypes;
    }

    if (currentCategory && currentCategory !== "") {
      return [currentCategory, ...serviceTypes];
    }

    return serviceTypes;
  };

  const renderCategorySelect = (
    value: string,
    onChange: (nextValue: string) => void,
  ) => {
    const options = getServiceTypeOptions(value);
    const hasOptions = options.length > 0;

    return (
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {!hasOptions && <option value="">Chưa có danh mục</option>}
        {hasOptions && value === "" && (
          <option value="" disabled>
            Chọn danh mục
          </option>
        )}
        {options.map((type) => (
          <option key={type || "blank"} value={type}>
            {type || "—"}
          </option>
        ))}
      </select>
    );
  };

  const renderAmountSuggestions = (onSelect: (amount: number) => void) => (
    <div className="amount-suggestions">
      {AMOUNT_SUGGESTIONS.map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => onSelect(amount)}
        >
          {formatAmountSuggestionLabel(amount)}
        </button>
      ))}
    </div>
  );

  const tabs = [
    { id: "services", label: "Dịch vụ & bảng giá", icon: <FiDatabase /> },
    { id: "guides", label: "Hướng dẫn viên", icon: <FiUsers /> },
    { id: "perdiem", label: "Phụ cấp", icon: <FiDollarSign /> },
    { id: "catalogs", label: "Danh mục chung", icon: <FiList /> },
  ];

  const handleAddService = () => {
    const trimmedName = serviceForm.name.trim();
    const trimmedUnit = serviceForm.unit.trim();

    if (!trimmedName) {
      setServiceFormErrors((current) => ({ ...current, name: true }));
      focusInput(serviceNameInputRef.current);
      return;
    }

    if (!serviceForm.category) {
      return;
    }

    if (serviceForm.price <= 0) {
      setServiceFormErrors((current) => ({ ...current, price: true }));
      focusInput(servicePriceInputRef.current);
      return;
    }

    if (!trimmedUnit) {
      return;
    }

    addService({
      name: trimmedName,
      category: serviceForm.category,
      price: serviceForm.price,
      unit: trimmedUnit,
      description: serviceForm.description || undefined,
    });
    setServiceForm(emptyServiceForm(serviceTypes[0] ?? ""));
    resetServiceFormErrors();
    focusInput(serviceNameInputRef.current);
  };

  const handleSaveService = () => {
    if (!editingService) return;

    const trimmedName = editingService.name.trim();

    if (!trimmedName) {
      setEditingServiceNameErrorId(editingService.id);
      focusInput(editingServiceNameRefs.current[editingService.id] ?? null);
      return;
    }

    if (!editingService.category) {
      return;
    }

    if (editingService.price <= 0) {
      setEditingServicePriceErrorId(editingService.id);
      focusInput(editingServicePriceRefs.current[editingService.id] ?? null);
      return;
    }

    updateService(editingService.id, {
      name: trimmedName,
      category: editingService.category,
      price: editingService.price,
      unit: editingService.unit,
      description: editingService.description,
    });
    setEditingService(null);
    clearServiceEditingErrors();
  };

  const handleAddGuide = () => {
    const trimmedName = guideForm.name.trim();

    if (!trimmedName) {
      setGuideFormNameError(true);
      focusInput(guideNameInputRef.current);
      return;
    }

    addGuide({
      name: trimmedName,
      phone: guideForm.phone || undefined,
      email: guideForm.email || undefined,
      languages: guideForm.languages
        .split(",")
        .map((language) => language.trim())
        .filter(Boolean),
    });
    setGuideForm(emptyGuideForm());
    setGuideFormNameError(false);
    focusInput(guideNameInputRef.current);
  };

  const handleSaveGuide = () => {
    if (!editingGuide) return;

    const trimmedName = editingGuide.name.trim();

    if (!trimmedName) {
      setEditingGuideNameErrorId(editingGuide.id);
      focusInput(editingGuideNameRefs.current[editingGuide.id] ?? null);
      return;
    }

    updateGuide(editingGuide.id, {
      name: trimmedName,
      phone: editingGuide.phone,
      email: editingGuide.email,
      languages: editingGuide.languages,
    });
    setEditingGuide(null);
    clearGuideEditingErrors();
  };

  const handleAddPerDiem = () => {
    const trimmedLocation = perDiemForm.location.trim();

    if (!trimmedLocation) {
      setPerDiemFormErrors((current) => ({ ...current, location: true }));
      focusInput(perDiemLocationInputRef.current);
      return;
    }

    if (perDiemForm.rate <= 0) {
      setPerDiemFormErrors((current) => ({ ...current, rate: true }));
      focusInput(perDiemRateInputRef.current);
      return;
    }

    addPerDiemRate({
      location: trimmedLocation,
      rate: perDiemForm.rate,
      currency: perDiemForm.currency,
      notes: perDiemForm.notes || undefined,
    });
    setPerDiemForm(emptyPerDiemForm());
    resetPerDiemFormErrors();
    focusInput(perDiemLocationInputRef.current);
  };

  const handleSavePerDiem = () => {
    if (!editingPerDiem) return;

    const trimmedLocation = editingPerDiem.location.trim();

    if (!trimmedLocation) {
      setEditingPerDiemError({ id: editingPerDiem.id, field: "location" });
      focusInput(editingPerDiemLocationRefs.current[editingPerDiem.id] ?? null);
      return;
    }

    if (editingPerDiem.rate <= 0) {
      setEditingPerDiemError({ id: editingPerDiem.id, field: "rate" });
      focusInput(editingPerDiemRateRefs.current[editingPerDiem.id] ?? null);
      return;
    }

    updatePerDiemRate(editingPerDiem.id, {
      location: trimmedLocation,
      rate: editingPerDiem.rate,
      currency: editingPerDiem.currency,
      notes: editingPerDiem.notes,
    });
    setEditingPerDiem(null);
    clearPerDiemEditingErrors();
  };

  const addSharedNationality = () => {
    if (!nationality.trim()) return;
    addNationality(nationality);
    setNationality("");
  };

  const addSharedServiceType = () => {
    if (!serviceType.trim()) return;
    addServiceType(serviceType);
    setServiceType("");
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      setShowClearDialog(false);
    } catch (error) {
      console.error("Failed to clear all data:", error);
      // You could add a toast notification here
    } finally {
      setIsClearing(false);
    }
  };

  const toCsvLine = (
    values: Array<string | number | boolean | null | undefined>,
  ) =>
    values
      .map((value) => {
        if (value === null || value === undefined) {
          return "";
        }
        const stringValue = String(value);
        const escapedValue = stringValue.replace(/"/g, '""');
        return /[",\n\r]/.test(stringValue) ? `"${escapedValue}"` : escapedValue;
      })
      .join(",");

  const exportToTextFile = (filename: string, lines: string[]) => {
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportServicesTxt = () => {
    const header = toCsvLine([
      "Tên dịch vụ",
      "Danh mục",
      "Giá",
      "Đơn vị",
      "Mô tả",
    ]);
    const lines = masterData.services.map((service) =>
      toCsvLine([
        service.name,
        service.category,
        service.price,
        service.unit,
        service.description ?? "",
      ]),
    );
    exportToTextFile("services.txt", [header, ...lines]);
  };

  const handleExportGuidesTxt = () => {
    const header = toCsvLine(["Tên", "Điện thoại", "Email", "Ngôn ngữ"]);
    const lines = masterData.guides.map((guide) =>
      toCsvLine([
        guide.name,
        guide.phone ?? "",
        guide.email ?? "",
        (guide.languages ?? []).join(", "),
      ]),
    );
    exportToTextFile("guides.txt", [header, ...lines]);
  };

  const handleExportPerDiemTxt = () => {
    const header = toCsvLine([
      "Địa điểm",
      "Mức phụ cấp",
      "Tiền tệ",
      "Ghi chú",
    ]);
    const lines = masterData.perDiemRates.map((rate) =>
      toCsvLine([
        rate.location,
        rate.rate,
        rate.currency,
        rate.notes ?? "",
      ]),
    );
    exportToTextFile("per-diem.txt", [header, ...lines]);
  };

  const handleExportCatalogsTxt = () => {
    const lines = [
      "[Quốc tịch]",
      ...masterData.catalogs.nationalities,
      "",
      "[Loại dịch vụ]",
      ...masterData.catalogs.serviceTypes,
    ];
    exportToTextFile("catalogs.txt", lines);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "services":
        return renderServicesTab();
      case "guides":
        return renderGuidesTab();
      case "perdiem":
        return renderPerDiemTab();
      case "catalogs":
        return renderCatalogsTab();
      default:
        return null;
    }
  };

  const renderServicesTab = () => (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <FiDatabase /> Dịch vụ & bảng giá
        </div>
        <p className="panel-description">
          Cập nhật giá tại đây sẽ ảnh hưởng ngay lập tức tới việc chuẩn hóa AI và các báo cáo tài chính.
        </p>
      </div>
      <div className="panel-body">
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}
        >
          <button
            type="button"
            className="ghost-button"
            onClick={handleExportServicesTxt}
          >
            <FiDownload /> Xuất TXT
          </button>
        </div>
        <div className="table-responsive">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Đơn vị</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {masterData.services.map((service) => (
                <tr key={service.id}>
                  <td>
                    {editingService?.id === service.id ? (
                      <input
                        ref={(element) => {
                          editingServiceNameRefs.current[service.id] = element;
                        }}
                        className={
                          editingServiceNameErrorId === service.id ? "input-error" : undefined
                        }
                        value={editingService.name}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setEditingService((current) =>
                            current ? { ...current, name: nextValue } : current,
                          );
                          if (editingServiceNameErrorId === service.id && nextValue.trim()) {
                            setEditingServiceNameErrorId(null);
                          }
                        }}
                      />
                    ) : (
                      service.name
                    )}
                  </td>
                  <td>
                    {editingService?.id === service.id ? (
                      renderCategorySelect(editingService.category, (nextValue) =>
                        setEditingService((current) =>
                          current ? { ...current, category: nextValue } : current,
                        ),
                      )
                    ) : (
                      service.category || "—"
                    )}
                  </td>
                  <td>
                    {editingService?.id === service.id ? (
                      <input
                        ref={(element) => {
                          editingServicePriceRefs.current[service.id] = element;
                        }}
                        className={
                          editingServicePriceErrorId === service.id ? "input-error" : undefined
                        }
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formatAmountInputValue(editingService.price)}
                        onChange={(event) => {
                          const nextValue = parseAmountInputValue(event.target.value);
                          setEditingService((current) =>
                            current ? { ...current, price: nextValue } : current,
                          );
                          if (editingServicePriceErrorId === service.id && nextValue > 0) {
                            setEditingServicePriceErrorId(null);
                          }
                        }}
                      />
                    ) : (
                      formatCurrency(service.price)
                    )}
                  </td>
                  <td>
                    {editingService?.id === service.id ? (
                      <input
                        value={editingService.unit}
                        onChange={(event) =>
                          setEditingService((current) =>
                            current ? { ...current, unit: event.target.value } : current,
                          )
                        }
                      />
                    ) : (
                      service.unit
                    )}
                  </td>
                  <td className="table-actions">
                    {editingService?.id === service.id ? (
                      <>
                        <button className="primary-button" onClick={handleSaveService}>
                          <FiSave /> Lưu
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => {
                            setEditingService(null);
                            clearServiceEditingErrors();
                          }}
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="ghost-button"
                          onClick={() => {
                            clearServiceEditingErrors();
                            setEditingService({ ...service });
                          }}
                        >
                          <FiEdit2 /> Chỉnh sửa
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => removeService(service.id)}
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="form-grid">
          <label className={serviceFormErrors.name ? "has-error" : undefined}>
            <span>Tên dịch vụ</span>
            <input
              ref={serviceNameInputRef}
              value={serviceForm.name}
              onChange={(event) => {
                const nextValue = event.target.value;
                setServiceForm((current) => ({ ...current, name: nextValue }));
                if (serviceFormErrors.name && nextValue.trim()) {
                  setServiceFormErrors((current) => ({ ...current, name: false }));
                }
              }}
            />
          </label>
          <label>
            <span>Danh mục</span>
            {renderCategorySelect(serviceForm.category, (nextValue) =>
              setServiceForm((current) => ({ ...current, category: nextValue })),
            )}
          </label>
          <label>
            <span>Đơn vị</span>
            <input
              value={serviceForm.unit}
              onChange={(event) =>
                setServiceForm((current) => ({ ...current, unit: event.target.value }))
              }
            />
          </label>
          <label className={serviceFormErrors.price ? "has-error" : undefined}>
            <span>Giá</span>
            <input
              ref={servicePriceInputRef}
              inputMode="numeric"
              pattern="[0-9]*"
              value={formatAmountInputValue(serviceForm.price)}
              onChange={(event) => {
                const nextValue = parseAmountInputValue(event.target.value);
                setServiceForm((current) => ({
                  ...current,
                  price: nextValue,
                }));
                if (serviceFormErrors.price && nextValue > 0) {
                  setServiceFormErrors((current) => ({ ...current, price: false }));
                }
              }}
            />
            {renderAmountSuggestions((amount) => {
              setServiceForm((current) => ({
                ...current,
                price: amount,
              }));
              setServiceFormErrors((current) => ({ ...current, price: false }));
              focusInput(servicePriceInputRef.current);
            })}
          </label>
          <label className="full-width">
            <span>Mô tả</span>
            <input
              value={serviceForm.description}
              onChange={(event) =>
                setServiceForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <button className="primary-button" onClick={handleAddService}>
          <FiPlus /> Thêm dịch vụ
        </button>
      </div>
    </div>
  );

  const renderGuidesTab = () => (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Hướng dẫn viên</div>
        <p className="panel-description">
          Cập nhật thông tin liên hệ để việc phân công của AI luôn chính xác.
        </p>
      </div>
      <div className="panel-body">
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}
        >
          <button
            type="button"
            className="ghost-button"
            onClick={handleExportGuidesTxt}
          >
            <FiDownload /> Xuất TXT
          </button>
        </div>
        <div className="table-responsive">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Điện thoại</th>
                <th>Email</th>
                <th>Ngôn ngữ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {masterData.guides.map((guide) => (
                <tr key={guide.id}>
                  <td>
                    {editingGuide?.id === guide.id ? (
                      <input
                        ref={(element) => {
                          editingGuideNameRefs.current[guide.id] = element;
                        }}
                        className={
                          editingGuideNameErrorId === guide.id ? "input-error" : undefined
                        }
                        value={editingGuide.name}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setEditingGuide((current) =>
                            current ? { ...current, name: nextValue } : current,
                          );
                          if (editingGuideNameErrorId === guide.id && nextValue.trim()) {
                            setEditingGuideNameErrorId(null);
                          }
                        }}
                      />
                    ) : (
                      guide.name
                    )}
                  </td>
                  <td>
                    {editingGuide?.id === guide.id ? (
                      <input
                        value={editingGuide.phone ?? ""}
                        onChange={(event) =>
                          setEditingGuide((current) =>
                            current ? { ...current, phone: event.target.value } : current,
                          )
                        }
                      />
                    ) : (
                      guide.phone || "—"
                    )}
                  </td>
                  <td>
                    {editingGuide?.id === guide.id ? (
                      <input
                        value={editingGuide.email ?? ""}
                        onChange={(event) =>
                          setEditingGuide((current) =>
                            current ? { ...current, email: event.target.value } : current,
                          )
                        }
                      />
                    ) : (
                      guide.email || "—"
                    )}
                  </td>
                  <td>
                    {editingGuide?.id === guide.id ? (
                      <input
                        value={(editingGuide.languages ?? []).join(", ")}
                        onChange={(event) =>
                          setEditingGuide((current) =>
                            current
                              ? {
                                  ...current,
                                  languages: event.target.value
                                    .split(",")
                                    .map((language) => language.trim())
                                    .filter(Boolean),
                                }
                              : current,
                          )
                        }
                      />
                    ) : (
                      (guide.languages ?? []).join(", ") || "—"
                    )}
                  </td>
                  <td className="table-actions">
                    {editingGuide?.id === guide.id ? (
                      <>
                        <button className="primary-button" onClick={handleSaveGuide}>
                          <FiSave /> Lưu
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => {
                            setEditingGuide(null);
                            clearGuideEditingErrors();
                          }}
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="ghost-button"
                          onClick={() => {
                            clearGuideEditingErrors();
                            setEditingGuide({ ...guide });
                          }}
                        >
                          <FiEdit2 /> Chỉnh sửa
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => removeGuide(guide.id)}
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="form-grid">
          <label className={guideFormNameError ? "has-error" : undefined}>
            <span>Tên</span>
            <input
              ref={guideNameInputRef}
              value={guideForm.name}
              onChange={(event) => {
                const nextValue = event.target.value;
                setGuideForm((current) => ({ ...current, name: nextValue }));
                if (guideFormNameError && nextValue.trim()) {
                  setGuideFormNameError(false);
                }
              }}
            />
          </label>
          <label>
            <span>Điện thoại</span>
            <input
              value={guideForm.phone}
              onChange={(event) =>
                setGuideForm((current) => ({ ...current, phone: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Email</span>
            <input
              value={guideForm.email}
              onChange={(event) =>
                setGuideForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </label>
          <label className="full-width">
            <span>Ngôn ngữ</span>
            <input
              value={guideForm.languages}
              onChange={(event) =>
                setGuideForm((current) => ({
                  ...current,
                  languages: event.target.value,
                }))
              }
              placeholder="Anh, Việt"
            />
          </label>
        </div>
        <button className="primary-button" onClick={handleAddGuide}>
          <FiPlus /> Thêm hướng dẫn viên
        </button>
      </div>
    </div>
  );

  const renderPerDiemTab = () => (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Cấu hình phụ cấp</div>
      </div>
      <div className="panel-body">
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}
        >
          <button
            type="button"
            className="ghost-button"
            onClick={handleExportPerDiemTxt}
          >
            <FiDownload /> Xuất TXT
          </button>
        </div>
        <div className="table-responsive">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Địa điểm</th>
                <th>Mức phụ cấp</th>
                <th>Tiền tệ</th>
                <th>Ghi chú</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {masterData.perDiemRates.map((rate) => (
                <tr key={rate.id}>
                  <td>
                    {editingPerDiem?.id === rate.id ? (
                      <input
                        ref={(element) => {
                          editingPerDiemLocationRefs.current[rate.id] = element;
                        }}
                        className={
                          editingPerDiemError?.id === rate.id &&
                          editingPerDiemError.field === "location"
                            ? "input-error"
                            : undefined
                        }
                        value={editingPerDiem.location}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setEditingPerDiem((current) =>
                            current ? { ...current, location: nextValue } : current,
                          );
                          if (
                            editingPerDiemError?.id === rate.id &&
                            editingPerDiemError.field === "location" &&
                            nextValue.trim()
                          ) {
                            setEditingPerDiemError(null);
                          }
                        }}
                      />
                    ) : (
                      rate.location
                    )}
                  </td>
                  <td>
                    {editingPerDiem?.id === rate.id ? (
                      <input
                        ref={(element) => {
                          editingPerDiemRateRefs.current[rate.id] = element;
                        }}
                        className={
                          editingPerDiemError?.id === rate.id &&
                          editingPerDiemError.field === "rate"
                            ? "input-error"
                            : undefined
                        }
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formatAmountInputValue(editingPerDiem.rate)}
                        onChange={(event) => {
                          const nextValue = parseAmountInputValue(event.target.value);
                          setEditingPerDiem((current) =>
                            current ? { ...current, rate: nextValue } : current,
                          );
                          if (
                            editingPerDiemError?.id === rate.id &&
                            editingPerDiemError.field === "rate" &&
                            nextValue > 0
                          ) {
                            setEditingPerDiemError(null);
                          }
                        }}
                      />
                    ) : (
                      formatCurrency(rate.rate, rate.currency)
                    )}
                  </td>
                  <td>
                    {editingPerDiem?.id === rate.id ? (
                      <input
                        value={editingPerDiem.currency}
                        onChange={(event) =>
                          setEditingPerDiem((current) =>
                            current ? { ...current, currency: event.target.value } : current,
                          )
                        }
                      />
                    ) : (
                      rate.currency
                    )}
                  </td>
                  <td>
                    {editingPerDiem?.id === rate.id ? (
                      <input
                        value={editingPerDiem.notes ?? ""}
                        onChange={(event) =>
                          setEditingPerDiem((current) =>
                            current ? { ...current, notes: event.target.value } : current,
                          )
                        }
                      />
                    ) : (
                      rate.notes || "—"
                    )}
                  </td>
                  <td className="table-actions">
                    {editingPerDiem?.id === rate.id ? (
                      <>
                        <button className="primary-button" onClick={handleSavePerDiem}>
                          <FiSave /> Lưu
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => {
                            setEditingPerDiem(null);
                            clearPerDiemEditingErrors();
                          }}
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="ghost-button"
                          onClick={() => {
                            clearPerDiemEditingErrors();
                            setEditingPerDiem({ ...rate });
                          }}
                        >
                          <FiEdit2 /> Chỉnh sửa
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => removePerDiemRate(rate.id)}
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="form-grid">
          <label className={perDiemFormErrors.location ? "has-error" : undefined}>
            <span>Địa điểm</span>
            <input
              ref={perDiemLocationInputRef}
              value={perDiemForm.location}
              onChange={(event) => {
                const nextValue = event.target.value;
                setPerDiemForm((current) => ({ ...current, location: nextValue }));
                if (perDiemFormErrors.location && nextValue.trim()) {
                  setPerDiemFormErrors((current) => ({ ...current, location: false }));
                }
              }}
            />
          </label>
          <label className={perDiemFormErrors.rate ? "has-error" : undefined}>
            <span>Mức phụ cấp</span>
            <input
              ref={perDiemRateInputRef}
              inputMode="numeric"
              pattern="[0-9]*"
              value={formatAmountInputValue(perDiemForm.rate)}
              onChange={(event) => {
                const nextValue = parseAmountInputValue(event.target.value);
                setPerDiemForm((current) => ({
                  ...current,
                  rate: nextValue,
                }));
                if (perDiemFormErrors.rate && nextValue > 0) {
                  setPerDiemFormErrors((current) => ({ ...current, rate: false }));
                }
              }}
            />
            {renderAmountSuggestions((amount) => {
              setPerDiemForm((current) => ({
                ...current,
                rate: amount,
              }));
              setPerDiemFormErrors((current) => ({ ...current, rate: false }));
              focusInput(perDiemRateInputRef.current);
            })}
          </label>
          <label>
            <span>Tiền tệ</span>
            <input
              value={perDiemForm.currency}
              onChange={(event) =>
                setPerDiemForm((current) => ({ ...current, currency: event.target.value }))
              }
            />
          </label>
          <label className="full-width">
            <span>Ghi chú</span>
            <input
              value={perDiemForm.notes}
              onChange={(event) =>
                setPerDiemForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </label>
        </div>
        <button className="primary-button" onClick={handleAddPerDiem}>
          <FiPlus /> Thêm mức phụ cấp
        </button>
      </div>
    </div>
  );

  const renderCatalogsTab = () => (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Danh mục dùng chung</div>
        <p className="panel-description">
          Các danh sách này được sử dụng cho hộp chọn và thuật toán đối chiếu của AI.
        </p>
      </div>
      <div className="panel-body">
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}
        >
          <button
            type="button"
            className="ghost-button"
            onClick={handleExportCatalogsTxt}
          >
            <FiDownload /> Xuất TXT
          </button>
        </div>
        <div className="catalog-grid">
          <div>
            <h3>Quốc tịch</h3>
            <ul className="pill-list">
              {masterData.catalogs.nationalities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="catalog-form">
              <input
                value={nationality}
                onChange={(event) => setNationality(event.target.value)}
                placeholder="Thêm quốc tịch"
              />
              <button className="ghost-button" onClick={addSharedNationality}>
                Thêm
              </button>
            </div>
          </div>
          <div>
            <h3>Loại dịch vụ</h3>
            <ul className="pill-list">
              {masterData.catalogs.serviceTypes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="catalog-form">
              <input
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
                placeholder="Thêm loại"
              />
              <button className="ghost-button" onClick={addSharedServiceType}>
                Thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Danh mục Dữ liệu chuẩn"
        description="Duy trì nguồn dữ liệu chuẩn cho tất cả hướng dẫn viên, dịch vụ, đối tác và bảng cấu hình."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <SyncStatus />
            <button className="ghost-button" onClick={resetMasterData}>
              <FiRefreshCw /> Đặt lại mặc định
            </button>
            <button 
              className="danger-button" 
              onClick={() => setShowClearDialog(true)}
              title="Xóa toàn bộ dữ liệu (cả local và cloud)"
            >
              <FiTrash2 /> Xóa toàn bộ
            </button>
          </div>
        }
      />
      
      <TabMenu tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="tab-content">
        {renderTabContent()}
      </div>

      <ConfirmationDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearAllData}
        title="Xóa toàn bộ dữ liệu"
        message="Bạn có chắc chắn muốn xóa toàn bộ dữ liệu Master Data? Hành động này sẽ xóa tất cả dữ liệu cả trên thiết bị này và trên cloud, và không thể hoàn tác."
        confirmText="Xóa toàn bộ"
        cancelText="Hủy"
        variant="danger"
        isLoading={isClearing}
      />
    </div>
  );
};