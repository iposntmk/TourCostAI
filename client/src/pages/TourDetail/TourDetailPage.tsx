import { useMemo, useState, type ReactNode } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiEdit,
  FiSave,
  FiTag,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { useMasterData } from "../../contexts/MasterDataContext";
import { useTours } from "../../contexts/TourContext";
import type { Expense, TabKey, Tour, TourService } from "../../types";
import {
  calculateOtherExpenseTotal,
  calculatePerDiemTotal,
  calculateServiceTotal,
} from "../../utils/calculations";
import {
  formatCurrency,
  formatDate,
  fromInputDateValue,
  toInputDateValue,
} from "../../utils/format";
import { generateId } from "../../utils/ids";
import { groupServicesByItinerary } from "../../utils/itinerary";

const tabs: { key: TabKey; label: string }[] = [
  { key: "general", label: "Thông tin chung" },
  { key: "perDiem", label: "Phụ cấp" },
  { key: "itinerary", label: "Lịch trình & địa điểm" },
  { key: "costs", label: "Chi phí tour" },
  { key: "otherExpenses", label: "Chi phí khác" },
  { key: "summary", label: "Tổng kết & tài chính" },
];

const cloneTour = (tour: Tour): Tour => ({
  ...tour,
  general: { ...tour.general },
  itinerary: tour.itinerary.map((item) => ({
    ...item,
    activities: [...item.activities],
  })),
  services: tour.services.map((service) => ({ ...service })),
  perDiem: tour.perDiem.map((entry) => ({ ...entry })),
  otherExpenses: tour.otherExpenses.map((expense) => ({ ...expense })),
  financials: { ...tour.financials },
});

const validationRules = (tour: Tour) => {
  const errors: string[] = [];
  if (!tour.general.code.trim()) errors.push("Yêu cầu nhập mã tour");
  if (!tour.general.customerName.trim())
    errors.push("Tên khách hàng không được để trống");
  if (!tour.general.guideId) errors.push("Phải phân công hướng dẫn viên");
  if (!tour.general.startDate || !tour.general.endDate)
    errors.push("Bắt buộc nhập ngày bắt đầu và kết thúc");
  if (tour.general.pax < 0) errors.push("Số khách không được âm");
  tour.services.forEach((service) => {
    if (service.quantity < 0)
      errors.push(`${service.description}: số lượng không được âm`);
    if (service.unitPrice < 0)
      errors.push(`${service.description}: đơn giá phải lớn hơn 0`);
  });
  tour.otherExpenses.forEach((expense) => {
    if (expense.amount < 0)
      errors.push(`${expense.description || "Chi phí"}: số tiền phải lớn hơn 0`);
  });
  return errors;
};

export const TourDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTourById, updateTour, deleteTour } = useTours();
  const { masterData } = useMasterData();
  const tour = id ? getTourById(id) : undefined;
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [editMode, setEditMode] = useState(false);
  const [editableTour, setEditableTour] = useState<Tour | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const baseTour = editMode && editableTour ? editableTour : tour;

  const servicesByDay = useMemo(
    () =>
      baseTour
        ? groupServicesByItinerary(baseTour.itinerary, baseTour.services)
        : {},
    [baseTour],
  );

  if (!tour) {
    return (
      <div className="page-wrapper">
        <PageHeader title="Không tìm thấy tour" />
        <div className="panel">
          <div className="panel-body">
            <p>Không thể tìm thấy tour yêu cầu. Có thể tour đã bị xóa.</p>
            <button className="primary-button" onClick={() => navigate("/")}>
              <FiArrowLeft /> Quay lại trang tổng quan
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayTour = editMode && editableTour ? editableTour : tour;

  const guide = masterData.guides.find(
    (guideItem) => guideItem.id === displayTour.general.guideId,
  );

  const discrepancies = displayTour.services.filter(
    (service) => (service.discrepancy ?? 0) !== 0,
  );

  const handleEnterEdit = () => {
    setEditableTour(cloneTour(tour));
    setEditMode(true);
    setValidationErrors([]);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditableTour(null);
    setValidationErrors([]);
  };

  const updateEditableTour = (updater: (draft: Tour) => Tour) => {
    setEditableTour((current) => (current ? updater(current) : current));
  };

  const handleGeneralChange = (field: keyof Tour["general"], value: string | number) => {
    updateEditableTour((draft) => ({
      ...draft,
      general: {
        ...draft.general,
        [field]: value,
      },
    }));
  };

  const handleServiceChange = (id: string, updates: Partial<TourService>) => {
    updateEditableTour((draft) => ({
      ...draft,
      services: draft.services.map((service) =>
        service.id === id ? { ...service, ...updates } : service,
      ),
    }));
  };

  const handleExpenseChange = (id: string, field: keyof Expense, value: string) => {
    updateEditableTour((draft) => ({
      ...draft,
      otherExpenses: draft.otherExpenses.map((expense) =>
        expense.id === id
          ? {
              ...expense,
              [field]:
                field === "amount"
                  ? Math.max(0, Number(value))
                  : field === "date"
                    ? fromInputDateValue(value)
                    : value,
            }
          : expense,
      ),
    }));
  };

  const handleAddExpense = () => {
    updateEditableTour((draft) => ({
      ...draft,
      otherExpenses: [
        ...draft.otherExpenses,
        {
          id: generateId(),
          description: "",
          amount: 0,
          date: draft.general.startDate,
          notes: "",
        },
      ],
    }));
  };

  const handleRemoveExpense = (idToRemove: string) => {
    updateEditableTour((draft) => ({
      ...draft,
      otherExpenses: draft.otherExpenses.filter((expense) => expense.id !== idToRemove),
    }));
  };

  const handleItineraryChange = (
    idToUpdate: string,
    field: "location" | "date" | "activities",
    value: string,
  ) => {
    updateEditableTour((draft) => ({
      ...draft,
      itinerary: draft.itinerary.map((item) =>
        item.id === idToUpdate
          ? {
              ...item,
              [field]:
                field === "activities"
                  ? value
                      .split(/\n|,/)
                      .map((activity) => activity.trim())
                      .filter(Boolean)
                  : field === "date"
                    ? fromInputDateValue(value)
                    : value,
            }
          : item,
      ),
    }));
  };

  const handleFinancialChange = (
    field: "advance" | "collectionsForCompany" | "companyTip",
    value: string,
  ) => {
    updateEditableTour((draft) => ({
      ...draft,
      financials: {
        ...draft.financials,
        [field]: Math.max(0, Number(value)),
      },
    }));
  };

  const describeSettlement = (difference: number) => {
    if (difference > 0) {
      return `Hoàn lại công ty ${formatCurrency(difference)}`;
    }
    if (difference < 0) {
      return `Công ty bù thêm ${formatCurrency(Math.abs(difference))}`;
    }
    return "Đã cân bằng";
  };

  const handleSave = () => {
    if (!editableTour) return;
    const errors = validationRules(editableTour);
    if (errors.length) {
      setValidationErrors(errors);
      return;
    }
    updateTour(tour.id, () => editableTour);
    setEditMode(false);
    setEditableTour(null);
    setValidationErrors([]);
  };

  const handleDelete = () => {
    if (window.confirm("Bạn có chắc muốn xóa tour này vĩnh viễn?")) {
      deleteTour(tour.id);
      navigate("/");
    }
  };

  const totalServices = calculateServiceTotal(displayTour.services);
  const totalPerDiem = calculatePerDiemTotal(displayTour.perDiem);
  const totalOtherExpenses = calculateOtherExpenseTotal(displayTour.otherExpenses);

  const renderGeneral = () => (
    <div className="detail-grid">
      <div className="detail-item">
        <span className="detail-label">Mã tour</span>
        {editMode ? (
          <input
            value={displayTour.general.code}
            maxLength={32}
            onChange={(event) => handleGeneralChange("code", event.target.value)}
          />
        ) : (
          <span className="detail-value">{displayTour.general.code}</span>
        )}
      </div>
      <div className="detail-item">
        <span className="detail-label">Khách hàng</span>
        {editMode ? (
          <input
            value={displayTour.general.customerName}
            maxLength={80}
            onChange={(event) =>
              handleGeneralChange("customerName", event.target.value)
            }
          />
        ) : (
          <span className="detail-value">{displayTour.general.customerName}</span>
        )}
      </div>
      <div className="detail-item">
        <span className="detail-label">Công ty khách hàng</span>
        {editMode ? (
          <input
            value={displayTour.general.clientCompany ?? ""}
            maxLength={80}
            onChange={(event) =>
              handleGeneralChange("clientCompany", event.target.value)
            }
          />
        ) : (
          <span className="detail-value">
            {displayTour.general.clientCompany || "—"}
          </span>
        )}
      </div>
      <div className="detail-item">
        <span className="detail-label">Quốc tịch</span>
        {editMode ? (
          <select
            value={displayTour.general.nationality}
            onChange={(event) =>
              handleGeneralChange("nationality", event.target.value)
            }
          >
            {masterData.catalogs.nationalities.map((nationality) => (
              <option key={nationality} value={nationality}>
                {nationality}
              </option>
            ))}
          </select>
        ) : (
          <span className="detail-value">{displayTour.general.nationality}</span>
        )}
      </div>
      <div className="detail-item">
        <span className="detail-label">Số khách</span>
        {editMode ? (
          <input
            type="number"
            min={0}
            value={displayTour.general.pax}
            onChange={(event) =>
              handleGeneralChange("pax", Math.max(0, Number(event.target.value)))
            }
          />
        ) : (
          <span className="detail-value">{displayTour.general.pax}</span>
        )}
      </div>
      <div className="detail-item">
        <span className="detail-label">Hướng dẫn viên</span>
        {editMode ? (
          <select
            value={displayTour.general.guideId}
            onChange={(event) =>
              handleGeneralChange("guideId", event.target.value)
            }
          >
            <option value="">Chọn hướng dẫn viên</option>
            {masterData.guides.map((guideItem) => (
              <option key={guideItem.id} value={guideItem.id}>
                {guideItem.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="detail-value">{guide?.name ?? "Chưa phân công"}</span>
        )}
      </div>
      <div className="detail-item">
        <span className="detail-label">Tài xế</span>
        {editMode ? (
          <input
            value={displayTour.general.driverName}
            maxLength={60}
            onChange={(event) =>
              handleGeneralChange("driverName", event.target.value)
            }
          />
        ) : (
          <span className="detail-value">{displayTour.general.driverName}</span>
        )}
      </div>
      <div className="detail-item">
        <span className="detail-label">Ngày bắt đầu</span>
        {editMode ? (
          <input
            type="date"
            value={toInputDateValue(displayTour.general.startDate)}
            onChange={(event) =>
              handleGeneralChange("startDate", event.target.value)
            }
          />
        ) : (
          <span className="detail-value">{formatDate(displayTour.general.startDate)}</span>
        )}
      </div>
      <div className="detail-item">
        <span className="detail-label">Ngày kết thúc</span>
        {editMode ? (
          <input
            type="date"
            value={toInputDateValue(displayTour.general.endDate)}
            onChange={(event) =>
              handleGeneralChange("endDate", event.target.value)
            }
          />
        ) : (
          <span className="detail-value">{formatDate(displayTour.general.endDate)}</span>
        )}
      </div>
      <div className="detail-item detail-notes">
        <span className="detail-label">Ghi chú</span>
        {editMode ? (
          <textarea
            rows={3}
            maxLength={400}
            value={displayTour.general.notes ?? ""}
            onChange={(event) =>
              handleGeneralChange("notes", event.target.value)
            }
          />
        ) : (
          <p>{displayTour.general.notes || "—"}</p>
        )}
      </div>
    </div>
  );

  const renderPerDiem = () => (
    <div className="table-responsive">
      <table className="data-table compact">
        <thead>
          <tr>
            <th>Địa điểm</th>
            <th>Số ngày</th>
            <th>Mức phụ cấp</th>
            <th>Tổng</th>
          </tr>
        </thead>
        <tbody>
          {displayTour.perDiem.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.location}</td>
              <td>{entry.days}</td>
              <td>{formatCurrency(entry.rate)}</td>
              <td>{formatCurrency(entry.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="panel-description">
        Phụ cấp được tính tự động dựa trên mức giá mới nhất trong Dữ liệu chuẩn.
      </p>
    </div>
  );

  const renderItinerary = () => (
    <div className="itinerary-detail">
      {displayTour.itinerary.map((item) => {
        const dayServices = servicesByDay[item.id] ?? [];
        const serviceCount = dayServices.length;
        return (
          <div key={item.id} className="itinerary-card">
            <div className="itinerary-card-header">
              <span className="badge">Ngày {item.day}</span>
              {editMode ? (
                <input
                  type="date"
                  value={toInputDateValue(item.date)}
                  onChange={(event) =>
                    handleItineraryChange(item.id, "date", event.target.value)
                  }
                />
              ) : (
                <span>{formatDate(item.date)}</span>
              )}
            </div>
            <div className="itinerary-card-body">
              {editMode ? (
                <input
                  value={item.location}
                  maxLength={120}
                  onChange={(event) =>
                    handleItineraryChange(item.id, "location", event.target.value)
                  }
                />
              ) : (
                <strong>{item.location}</strong>
              )}
              <div className="itinerary-activities">
                <span className="day-section-label">Hoạt động</span>
                {editMode ? (
                  <textarea
                    rows={3}
                    value={item.activities.join("\n")}
                    onChange={(event) =>
                      handleItineraryChange(item.id, "activities", event.target.value)
                    }
                  />
                ) : (
                  <ul className="activities-list">
                    {item.activities.map((activity) => (
                      <li key={activity}>{activity}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="day-services">
                <div className="day-services-header">
                  <span className="day-section-label">Dịch vụ</span>
                  <span className="day-services-count">{serviceCount} mục</span>
                </div>
                {serviceCount > 0 ? (
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
                              <strong
                                className={`service-discrepancy ${
                                  discrepancy > 0 ? "positive" : "negative"
                                }`}
                              >
                                  {formatCurrency(discrepancy)}
                                </strong>
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="empty-services">Chưa có dịch vụ nào gán cho ngày này.</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCosts = () => (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>Dịch vụ</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Giá theo tài liệu</th>
            <th>Chênh lệch</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {displayTour.services.map((service) => (
            <tr key={service.id}>
              <td>{service.description}</td>
              <td>
                {editMode ? (
                  <input
                    type="number"
                    min={0}
                    value={service.quantity}
                    onChange={(event) =>
                      handleServiceChange(service.id, {
                        quantity: Math.max(0, Number(event.target.value)),
                      })
                    }
                  />
                ) : (
                  service.quantity
                )}
              </td>
              <td>
                {editMode ? (
                  <input
                    type="number"
                    min={0}
                    value={service.unitPrice}
                    onChange={(event) =>
                      handleServiceChange(service.id, {
                        unitPrice: Math.max(0, Number(event.target.value)),
                      })
                    }
                  />
                ) : (
                  formatCurrency(service.unitPrice)
                )}
              </td>
              <td>{formatCurrency(service.sourcePrice ?? service.unitPrice)}</td>
              <td>
                <span className={`tag ${service.discrepancy ? "warning" : "success"}`}>
                  {service.discrepancy
                    ? `${service.discrepancy > 0 ? "+" : ""}${formatCurrency(
                        service.discrepancy,
                      )}`
                  : "Khớp"}
              </span>
            </td>
            <td>
                {editMode ? (
                  <input
                    value={service.notes ?? ""}
                    maxLength={160}
                    onChange={(event) =>
                      handleServiceChange(service.id, {
                        notes: event.target.value,
                      })
                    }
                  />
                ) : (
                  service.notes ?? "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderOtherExpenses = () => (
    <div>
      <div className="table-responsive">
        <table className="data-table compact">
          <thead>
            <tr>
              <th>Mô tả</th>
              <th>Số tiền</th>
              <th>Ngày</th>
              <th>Ghi chú</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayTour.otherExpenses.map((expense) => (
              <tr key={expense.id}>
                <td>
                  {editMode ? (
                    <input
                      value={expense.description}
                      maxLength={120}
                      onChange={(event) =>
                        handleExpenseChange(expense.id, "description", event.target.value)
                      }
                    />
                  ) : (
                    expense.description
                  )}
                </td>
                <td>
                  {editMode ? (
                    <input
                      type="number"
                      min={0}
                      value={expense.amount}
                      onChange={(event) =>
                        handleExpenseChange(expense.id, "amount", event.target.value)
                      }
                    />
                  ) : (
                    formatCurrency(expense.amount)
                  )}
                </td>
                <td>
                  {editMode ? (
                    <input
                      type="date"
                      value={toInputDateValue(expense.date)}
                      onChange={(event) =>
                        handleExpenseChange(expense.id, "date", event.target.value)
                      }
                    />
                  ) : (
                    formatDate(expense.date)
                  )}
                </td>
                <td>
                  {editMode ? (
                    <input
                      value={expense.notes ?? ""}
                      maxLength={160}
                      onChange={(event) =>
                        handleExpenseChange(expense.id, "notes", event.target.value)
                      }
                    />
                  ) : (
                    expense.notes ?? "—"
                  )}
                </td>
                <td>
                  {editMode && (
                    <button
                      className="ghost-button"
                      onClick={() => handleRemoveExpense(expense.id)}
                    >
                      Xóa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editMode && (
        <button className="ghost-button" onClick={handleAddExpense}>
          Thêm chi phí
        </button>
      )}
    </div>
  );

  const renderSummary = () => {
    const settlementDifference = displayTour.financials.differenceToAdvance;
    const summaryItems: {
      key: string;
      label: string;
      value: number;
      editableKey?: "advance" | "collectionsForCompany" | "companyTip";
      tone: "positive" | "negative" | "neutral";
      note?: string;
    }[] = [
      {
        key: "advance",
        label: "Tạm ứng",
        value: displayTour.financials.advance,
        editableKey: "advance",
        tone: "positive",
      },
      {
        key: "collections",
        label: "Thu hộ công ty",
        value: displayTour.financials.collectionsForCompany,
        editableKey: "collectionsForCompany",
        tone: "positive",
      },
      {
        key: "companyTip",
        label: "Tiền tip công ty",
        value: displayTour.financials.companyTip,
        editableKey: "companyTip",
        tone: "positive",
      },
      {
        key: "services",
        label: "Tổng dịch vụ",
        value: totalServices,
        tone: "negative",
      },
      {
        key: "perDiem",
        label: "Tổng phụ cấp",
        value: totalPerDiem,
        tone: "negative",
      },
      {
        key: "otherExpenses",
        label: "Chi phí khác",
        value: totalOtherExpenses,
        tone: "negative",
      },
      {
        key: "totalCost",
        label: "Tổng chi phí",
        value: displayTour.financials.totalCost,
        tone: "negative",
      },
      {
        key: "difference",
        label: "Chênh lệch quyết toán",
        value: settlementDifference,
        tone:
          settlementDifference > 0
            ? "positive"
            : settlementDifference < 0
              ? "negative"
              : "neutral",
        note: describeSettlement(settlementDifference),
      },
    ];

    return (
      <div className="summary-list">
        {summaryItems.map((item) => (
          <div key={item.key} className={`summary-row ${item.tone}`}>
            <div className="summary-cell">
              <span className="summary-label">{item.label}</span>
              {editMode && item.editableKey ? (
                <input
                  type="number"
                  min={0}
                  value={displayTour.financials[item.editableKey]}
                  onChange={(event) =>
                    handleFinancialChange(item.editableKey!, event.target.value)
                  }
                  className="summary-input"
                />
              ) : (
                <span className={`summary-value ${item.tone}`}>
                  {formatCurrency(item.value)}
                </span>
              )}
            </div>
            {item.note && !editMode && (
              <div className="summary-note">{item.note}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  let tabContent: ReactNode;
  switch (activeTab) {
    case "perDiem":
      tabContent = renderPerDiem();
      break;
    case "itinerary":
      tabContent = renderItinerary();
      break;
    case "costs":
      tabContent = renderCosts();
      break;
    case "otherExpenses":
      tabContent = renderOtherExpenses();
      break;
    case "summary":
      tabContent = renderSummary();
      break;
    default:
      tabContent = renderGeneral();
  }

  return (
    <div className="page-wrapper">
      <PageHeader
        title={displayTour.general.code}
        description={`${displayTour.general.customerName} · ${formatDate(displayTour.general.startDate)} → ${formatDate(displayTour.general.endDate)}`}
        actions={
          <div className="action-group">
            <button className="ghost-button" onClick={() => navigate("/")}>
              <FiArrowLeft /> Quay lại
            </button>
            {editMode ? (
              <>
                <button className="ghost-button" onClick={handleCancelEdit}>
                  <FiXCircle /> Hủy
                </button>
                <button className="primary-button" onClick={handleSave}>
                  <FiSave /> Lưu thay đổi
                </button>
              </>
            ) : (
              <>
                <button className="ghost-button" onClick={handleEnterEdit}>
                  <FiEdit /> Chỉnh sửa
                </button>
                <button className="danger-button" onClick={handleDelete}>
                  <FiTrash2 /> Xóa
                </button>
              </>
            )}
          </div>
        }
      />
      <div className="panel">
        <div className="panel-header with-tabs">
          <div className="panel-title">
            <FiTag /> Tổng quan tour
          </div>
          <div className="tab-list">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-body">
          {validationErrors.length > 0 && (
            <div className="error-banner">
              <FiAlertTriangle />
              <ul>
                {validationErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          {discrepancies.length > 0 && !editMode && (
            <div className="warning-banner">
              <FiAlertTriangle /> {discrepancies.length} dịch vụ đã được chuẩn hóa theo Dữ liệu chuẩn.
            </div>
          )}
          {tabContent}
        </div>
      </div>
    </div>
  );
};
