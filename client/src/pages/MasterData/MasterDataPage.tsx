import { useEffect, useState } from "react";
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

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [editingPerDiem, setEditingPerDiem] = useState<PerDiemRate | null>(null);
  const [nationality, setNationality] = useState("");
  const [serviceType, setServiceType] = useState("");

  const [activeTab, setActiveTab] = useState("services");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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

  const tabs = [
    { id: "services", label: "Dịch vụ & bảng giá", icon: <FiDatabase /> },
    { id: "guides", label: "Hướng dẫn viên", icon: <FiUsers /> },
    { id: "perdiem", label: "Phụ cấp", icon: <FiDollarSign /> },
    { id: "catalogs", label: "Danh mục chung", icon: <FiList /> },
  ];

  const handleAddService = () => {
    if (
      !serviceForm.name.trim() ||
      !serviceForm.category ||
      serviceForm.price <= 0 ||
      !serviceForm.unit.trim()
    ) {
      return;
    }
    addService({
      name: serviceForm.name.trim(),
      category: serviceForm.category,
      price: serviceForm.price,
      unit: serviceForm.unit.trim(),
      description: serviceForm.description || undefined,
    });
    setServiceForm(emptyServiceForm(serviceTypes[0] ?? ""));
  };

  const handleSaveService = () => {
    if (!editingService) return;
    if (!editingService.name.trim() || !editingService.category || editingService.price <= 0) return;
    updateService(editingService.id, {
      name: editingService.name.trim(),
      category: editingService.category,
      price: editingService.price,
      unit: editingService.unit,
      description: editingService.description,
    });
    setEditingService(null);
  };

  const handleAddGuide = () => {
    if (!guideForm.name.trim()) return;
    addGuide({
      name: guideForm.name.trim(),
      phone: guideForm.phone || undefined,
      email: guideForm.email || undefined,
      languages: guideForm.languages
        .split(",")
        .map((language) => language.trim())
        .filter(Boolean),
    });
    setGuideForm(emptyGuideForm());
  };

  const handleSaveGuide = () => {
    if (!editingGuide) return;
    if (!editingGuide.name.trim()) return;
    updateGuide(editingGuide.id, {
      name: editingGuide.name.trim(),
      phone: editingGuide.phone,
      email: editingGuide.email,
      languages: editingGuide.languages,
    });
    setEditingGuide(null);
  };

  const handleAddPerDiem = () => {
    if (!perDiemForm.location.trim() || perDiemForm.rate <= 0) return;
    addPerDiemRate({
      location: perDiemForm.location.trim(),
      rate: perDiemForm.rate,
      currency: perDiemForm.currency,
      notes: perDiemForm.notes || undefined,
    });
    setPerDiemForm(emptyPerDiemForm());
  };

  const handleSavePerDiem = () => {
    if (!editingPerDiem) return;
    if (!editingPerDiem.location.trim()) return;
    updatePerDiemRate(editingPerDiem.id, {
      location: editingPerDiem.location.trim(),
      rate: editingPerDiem.rate,
      currency: editingPerDiem.currency,
      notes: editingPerDiem.notes,
    });
    setEditingPerDiem(null);
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
                        value={editingService.name}
                        onChange={(event) =>
                          setEditingService((current) =>
                            current ? { ...current, name: event.target.value } : current,
                          )
                        }
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
                        type="number"
                        min={0}
                        value={editingService.price}
                        onChange={(event) =>
                          setEditingService((current) =>
                            current
                              ? { ...current, price: Math.max(0, Number(event.target.value)) }
                              : current,
                          )
                        }
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
                        <button className="ghost-button" onClick={() => setEditingService(null)}>
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="ghost-button"
                          onClick={() => setEditingService(service)}
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
          <label>
            <span>Tên dịch vụ</span>
            <input
              value={serviceForm.name}
              onChange={(event) =>
                setServiceForm((current) => ({ ...current, name: event.target.value }))
              }
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
          <label>
            <span>Giá</span>
            <input
              type="number"
              min={0}
              value={serviceForm.price}
              onChange={(event) =>
                setServiceForm((current) => ({
                  ...current,
                  price: Math.max(0, Number(event.target.value)),
                }))
              }
            />
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
                        value={editingGuide.name}
                        onChange={(event) =>
                          setEditingGuide((current) =>
                            current ? { ...current, name: event.target.value } : current,
                          )
                        }
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
                        <button className="ghost-button" onClick={() => setEditingGuide(null)}>
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="ghost-button"
                          onClick={() => setEditingGuide(guide)}
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
          <label>
            <span>Tên</span>
            <input
              value={guideForm.name}
              onChange={(event) =>
                setGuideForm((current) => ({ ...current, name: event.target.value }))
              }
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
                        value={editingPerDiem.location}
                        onChange={(event) =>
                          setEditingPerDiem((current) =>
                            current ? { ...current, location: event.target.value } : current,
                          )
                        }
                      />
                    ) : (
                      rate.location
                    )}
                  </td>
                  <td>
                    {editingPerDiem?.id === rate.id ? (
                      <input
                        type="number"
                        min={0}
                        value={editingPerDiem.rate}
                        onChange={(event) =>
                          setEditingPerDiem((current) =>
                            current
                              ? { ...current, rate: Math.max(0, Number(event.target.value)) }
                              : current,
                          )
                        }
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
                        <button className="ghost-button" onClick={() => setEditingPerDiem(null)}>
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="ghost-button"
                          onClick={() => setEditingPerDiem(rate)}
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
          <label>
            <span>Địa điểm</span>
            <input
              value={perDiemForm.location}
              onChange={(event) =>
                setPerDiemForm((current) => ({ ...current, location: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Mức phụ cấp</span>
            <input
              type="number"
              min={0}
              value={perDiemForm.rate}
              onChange={(event) =>
                setPerDiemForm((current) => ({
                  ...current,
                  rate: Math.max(0, Number(event.target.value)),
                }))
              }
            />
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