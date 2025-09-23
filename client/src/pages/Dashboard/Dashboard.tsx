import { useMemo, useState } from "react";
import { FiCalendar, FiDownload, FiFilter, FiPlus, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { useMasterData } from "../../contexts/MasterDataContext";
import { useTours } from "../../contexts/TourContext";
import { calculateOtherExpenseTotal, calculateServiceTotal } from "../../utils/calculations";
import { formatCurrency, formatDate } from "../../utils/format";

const today = new Date();
today.setHours(0, 0, 0, 0);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { tours } = useTours();
  const { masterData } = useMasterData();
  const [searchTerm, setSearchTerm] = useState("");
  const [guideFilter, setGuideFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredTours = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return tours.filter((tour) => {
      const matchesTerm = term
        ? [
            tour.general.code,
            tour.general.customerName,
            tour.general.clientCompany,
          ]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(term))
        : true;
      const matchesGuide =
        guideFilter === "all" || tour.general.guideId === guideFilter;
      const startDate = new Date(tour.general.startDate);
      const matchesFrom = fromDate ? startDate >= new Date(fromDate) : true;
      const matchesTo = toDate ? startDate <= new Date(toDate) : true;
      return matchesTerm && matchesGuide && matchesFrom && matchesTo;
    });
  }, [tours, searchTerm, guideFilter, fromDate, toDate]);

  const upcomingTours = useMemo(
    () =>
      tours.filter((tour) => new Date(tour.general.startDate) >= today).sort(
        (a, b) =>
          new Date(a.general.startDate).getTime() -
          new Date(b.general.startDate).getTime(),
      ),
    [tours],
  );

  const totalSpend = useMemo(
    () => tours.reduce((total, tour) => total + tour.financials.totalCost, 0),
    [tours],
  );

  const totalCorrections = useMemo(
    () =>
      tours.reduce(
        (count, tour) =>
          count +
          tour.services.filter((service) => (service.discrepancy ?? 0) !== 0).length,
        0,
      ),
    [tours],
  );

  const handleExport = () => {
    const exportRows = filteredTours.map((tour) => {
      const guide = masterData.guides.find(
        (guideItem) => guideItem.id === tour.general.guideId,
      );
      return {
        "Tour Code": tour.general.code,
        Customer: tour.general.customerName,
        Company: tour.general.clientCompany ?? "",
        Nationality: tour.general.nationality,
        Pax: tour.general.pax,
        "Start Date": formatDate(tour.general.startDate),
        "End Date": formatDate(tour.general.endDate),
        Guide: guide?.name ?? "",
        "Service Total": calculateServiceTotal(tour.services),
        "Other Expenses": calculateOtherExpenseTotal(tour.otherExpenses),
        "Per Diem": tour.perDiem.reduce((sum, item) => sum + item.total, 0),
        "Total Cost": tour.financials.totalCost,
        "Difference To Advance": tour.financials.differenceToAdvance,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tours");
    XLSX.writeFile(workbook, "tour-report.xlsx");
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Operations dashboard"
        description="Monitor current tours, discrepancies corrected by the AI engine, and financial outcomes."
        actions={
          <button className="primary-button" onClick={() => navigate("/new")}>
            <FiPlus /> New tour
          </button>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Active tours"
          value={String(filteredTours.length)}
          trend={`of ${tours.length} in database`}
          icon={<FiFilter />}
          accent="blue"
        />
        <StatCard
          label="Upcoming departures"
          value={String(upcomingTours.length)}
          trend={
            upcomingTours[0]
              ? `Next: ${formatDate(upcomingTours[0].general.startDate)}`
              : "No upcoming tours"
          }
          icon={<FiCalendar />}
          accent="green"
        />
        <StatCard
          label="Total spend"
          value={formatCurrency(totalSpend)}
          trend="Aggregated cost incl. per diem"
          icon={<FiDownload />}
          accent="purple"
        />
        <StatCard
          label="Price corrections"
          value={String(totalCorrections)}
          trend="Services normalized by Master Data"
          icon={<FiSearch />}
          accent="orange"
        />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <FiFilter /> Filters
          </div>
          <div className="filter-grid">
            <div className="filter-field">
              <label htmlFor="search">Search</label>
              <div className="input-with-icon">
                <FiSearch />
                <input
                  id="search"
                  type="search"
                  value={searchTerm}
                  placeholder="Tour code, customer, company"
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
            <div className="filter-field">
              <label htmlFor="guide">Guide</label>
              <select
                id="guide"
                value={guideFilter}
                onChange={(event) => setGuideFilter(event.target.value)}
              >
                <option value="all">All guides</option>
                {masterData.guides.map((guide) => (
                  <option key={guide.id} value={guide.id}>
                    {guide.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="from">From</label>
              <input
                id="from"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div className="filter-field">
              <label htmlFor="to">To</label>
              <input
                id="to"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
            <button className="ghost-button" onClick={handleExport}>
              <FiDownload /> Export Excel
            </button>
          </div>
        </div>
        <div className="panel-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tour</th>
                  <th>Dates</th>
                  <th>Guide</th>
                  <th>Financial summary</th>
                  <th>Corrections</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTours.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      No tours match the current filters.
                    </td>
                  </tr>
                )}
                {filteredTours.map((tour) => {
                  const guide = masterData.guides.find(
                    (guideItem) => guideItem.id === tour.general.guideId,
                  );
                  const corrections = tour.services.filter(
                    (service) => (service.discrepancy ?? 0) !== 0,
                  );
                  return (
                    <tr key={tour.id}>
                      <td>
                        <div className="table-primary">
                          <div className="table-title">{tour.general.code}</div>
                          <div className="table-subtitle">
                            {tour.general.customerName} · {tour.general.pax} pax
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="table-primary">
                          <div>{formatDate(tour.general.startDate)}</div>
                          <div className="table-subtitle">
                            to {formatDate(tour.general.endDate)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="table-primary">
                          <div>{guide?.name ?? "Unassigned"}</div>
                          <div className="table-subtitle">Driver: {tour.general.driverName}</div>
                        </div>
                      </td>
                      <td>
                        <div className="table-primary">
                          <div>{formatCurrency(tour.financials.totalCost)}</div>
                          <div className="table-subtitle">
                            Advance: {formatCurrency(tour.financials.advance)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`tag ${corrections.length ? "warning" : "success"}`}>
                          {corrections.length ? `${corrections.length} adjusted` : "All matched"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="ghost-button"
                          onClick={() => navigate(`/tour/${tour.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
