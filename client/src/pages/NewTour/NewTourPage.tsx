import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiFilePlus,
  FiRefreshCw,
  FiUploadCloud,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { useMasterData } from "../../contexts/MasterDataContext";
import { useTours } from "../../contexts/TourContext";
import type { Expense, FinancialSummary, MatchedService } from "../../types";
import { formatDate, fromInputDateValue, toInputDateValue } from "../../utils/format";
import {
  buildTourServices,
  matchExtractedServices,
  simulateGeminiExtraction,
} from "../../utils/extraction";
import { generateId } from "../../utils/ids";

export const NewTourPage = () => {
  const navigate = useNavigate();
  const { masterData, findGuideByName } = useMasterData();
  const { createTour } = useTours();

  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [extractionNotes, setExtractionNotes] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchedService[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<Expense[]>([]);
  const [financials, setFinancials] = useState<FinancialSummary>({
    advance: 0,
    collectionsForCompany: 0,
    companyTip: 0,
    totalCost: 0,
    differenceToAdvance: 0,
  });
  const [general, setGeneral] = useState({
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
  const [itinerary, setItinerary] = useState(
    [] as { id: string; day: number; date: string; location: string; activities: string[] }[],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileName) {
      setExtractionNotes(null);
    }
  }, [fileName]);

  const corrections = useMemo(
    () => matches.filter((item) => Math.abs(item.discrepancy) > 0),
    [matches],
  );

  const handleRunExtraction = () => {
    setProcessing(true);
    setError(null);
    setTimeout(() => {
      const extraction = simulateGeminiExtraction(masterData);
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
      setExtractionNotes(
        `Google Gemini successfully parsed ${extraction.services.length} services and ${extraction.itinerary.length} itinerary days from the uploaded program.`,
      );
      setProcessing(false);
    }, 900);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setFileName(event.target.files[0].name);
    }
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
      setError("Tour code is required.");
      return;
    }
    if (!general.guideId) {
      setError("Please assign a guide.");
      return;
    }
    if (!general.startDate || !general.endDate) {
      setError("Start and end dates are mandatory.");
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
    ? "Calling Google Gemini and applying Master Data rules..."
    : extractionNotes;

  const canConfirm = matches.length > 0 && !processing;

  return (
    <div className="page-wrapper">
      <PageHeader
        title="AI image intake"
        description="Upload a photographed tour program and let Gemini extract, normalise and validate all the data against your Master Data catalogues."
      />
      <div className="layout-two-column">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <FiUploadCloud /> Upload itinerary imagery
            </div>
            <p className="panel-description">
              Supported formats: JPG, PNG, PDF. The AI engine reads multi-page documents and detects prices, guides, services and notes.
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
                {fileName
                  ? `Selected file: ${fileName}`
                  : "Drag & drop or click to choose tour program images"}
              </span>
            </label>
            <div className="upload-actions">
              <button
                className="primary-button"
                disabled={!fileName || processing}
                onClick={handleRunExtraction}
              >
                {processing ? <FiRefreshCw className="spin" /> : <FiUploadCloud />} Run Gemini extraction
              </button>
              {fileName && (
                <button
                  className="ghost-button"
                  onClick={() => {
                    setFileName("");
                    setMatches([]);
                    setOtherExpenses([]);
                    setProcessing(false);
                    setExtractionNotes(null);
                  }}
                >
                  Reset
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
                <FiAlertTriangle /> {corrections.length} services were updated to match official pricing in Master Data.
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
              <FiCheckCircle /> Verification & clean-up
            </div>
            <p className="panel-description">
              Review the normalised values before committing the tour to the operations database.
            </p>
          </div>
          <div className="panel-body">
            <div className="form-grid">
              <label>
                <span>Tour code</span>
                <input
                  value={general.code}
                  onChange={(event) =>
                    setGeneral((current) => ({ ...current, code: event.target.value }))
                  }
                  placeholder="e.g. SGN-DAD-2406"
                />
              </label>
              <label>
                <span>Customer</span>
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
                <span>Client company</span>
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
                <span>Nationality</span>
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
                <span>Pax</span>
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
                <span>Guide</span>
                <select
                  value={general.guideId}
                  onChange={(event) =>
                    setGeneral((current) => ({
                      ...current,
                      guideId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select guide</option>
                  {masterData.guides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Driver</span>
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
                <span>Start date</span>
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
                <span>End date</span>
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
              <span>Operational notes</span>
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

            <h3 className="section-title">AI-detected services</h3>
            <div className="table-responsive">
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Source service</th>
                    <th>Master Data match</th>
                    <th>Qty</th>
                    <th>Doc price</th>
                    <th>Master price</th>
                    <th>Status</th>
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
                          <option value="">No match</option>
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
                            ? `Updated by ${match.discrepancy.toLocaleString("vi-VN")}`
                            : "Aligned"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {itinerary.length > 0 && (
              <div className="itinerary-preview">
                <h3 className="section-title">Itinerary preview</h3>
                <ul>
                  {itinerary.map((item) => (
                    <li key={item.id}>
                      <div className="itinerary-preview-day">
                        <div className="itinerary-preview-header">
                          <span className="badge">Day {item.day}</span>
                          <span>{formatDate(item.date)}</span>
                        </div>
                        <div className="itinerary-preview-body">
                          <strong>{item.location}</strong>
                          <p>{item.activities.join(", ")}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <h3 className="section-title">Other expenses</h3>
            <div className="table-responsive">
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount (VND)</th>
                    <th>Date</th>
                    <th>Notes</th>
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
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="ghost-button" onClick={handleAddExpense}>
              Add expense
            </button>

            <h3 className="section-title">Financial summary</h3>
            <div className="form-grid">
              <label>
                <span>Advance</span>
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
                <span>Collections for company</span>
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
                <span>Company tip</span>
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
                Confirm and create tour
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
