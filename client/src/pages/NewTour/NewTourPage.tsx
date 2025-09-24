import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiFilePlus,
  FiFileText,
  FiRefreshCw,
  FiUploadCloud,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { useMasterData } from "../../contexts/MasterDataContext";
import { useTours } from "../../contexts/TourContext";
import type {
  Expense,
  ExtractionResult,
  FinancialSummary,
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
import { generateId } from "../../utils/ids";
import { groupServicesByItinerary } from "../../utils/itinerary";

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

  const jsonInputRef = useRef<HTMLInputElement | null>(null);

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

  const [uploadSource, setUploadSource] = useState<
    { name: string; type: "image" | "json" }
  | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractionNotes, setExtractionNotes] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchedService[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<Expense[]>([]);
  const [financials, setFinancials] = useState<FinancialSummary>(() => ({
    ...initialFinancialSummary,
  }));
  const [general, setGeneral] = useState(createInitialGeneral);
  const [itinerary, setItinerary] = useState(
    [] as { id: string; day: number; date: string; location: string; activities: string[] }[],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadSource) {
      setExtractionNotes(null);
    }
  }, [uploadSource]);

  const resetFormState = () => {
    setGeneral(createInitialGeneral());
    setMatches([]);
    setItinerary([]);
    setOtherExpenses([]);
    setFinancials({ ...initialFinancialSummary });
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
    const message =
      options?.note ??
      `Google Gemini đã trích xuất thành công ${extraction.services.length} dịch vụ và ${extraction.itinerary.length} ngày lịch trình từ chương trình đã tải lên.`;
    setExtractionNotes(message);
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
    setProcessing(true);
    setError(null);
    setTimeout(() => {
      const extraction = simulateGeminiExtraction(masterData);
      applyExtraction(extraction);
      setProcessing(false);
    }, 900);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadSource({ name: file.name, type: "image" });
    setError(null);
    setExtractionNotes(null);
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

      const importTour = (tourData: Tour) => {
        createTour({
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
          toursInFile.forEach(importTour);
          resetFormState();
          noteParts.push(`${toursInFile.length} tour đã được thêm vào hệ thống`);
        }

        if (extractionsInFile.length > 0) {
          extractionToApply = extractionsInFile[0];
        }
      } else if (isTour(parsed)) {
        importTour(parsed);
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

  const handleCreateTour = () => {
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

    const newTourId = createTour({
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

  const canConfirm = matches.length > 0 && !processing;

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Tiếp nhận hình ảnh bằng AI"
        description="Tải ảnh chương trình tour và để Gemini trích xuất, chuẩn hóa và xác thực dữ liệu dựa trên các danh mục Dữ liệu chuẩn."
      />
      <div className="layout-two-column">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <FiUploadCloud /> Tải hình ảnh lịch trình
            </div>
            <p className="panel-description">
              Định dạng hỗ trợ: JPG, PNG, PDF. Công cụ AI đọc được tài liệu nhiều trang và nhận diện giá, hướng dẫn viên, dịch vụ cùng ghi chú.
            </p>
            <p className="panel-description">
              Hoặc tải tệp JSON đã chuẩn hóa để thêm tour hàng loạt hoặc điền sẵn dữ liệu kiểm tra trước khi xác nhận.
            </p>
          </div>
          <div className="panel-body upload-zone">
            <label className="upload-dropzone">
              <input
                type="file"
                accept="image/*,application/pdf"
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
            <div className="upload-actions">
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
            {corrections.length > 0 && !processing && (
              <div className="warning-banner">
                <FiAlertTriangle /> {corrections.length} dịch vụ đã được cập nhật để khớp với giá chuẩn trong Dữ liệu chuẩn.
              </div>
            )}
            {error && (
              <div className="error-banner">
                <FiAlertTriangle /> {error}
              </div>
            )}
          </div>
        </div>

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
      </div>
    </div>
  );
};
