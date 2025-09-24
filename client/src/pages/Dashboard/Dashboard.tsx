import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiDownload, FiFilter, FiList, FiPlus, FiSearch } from "react-icons/fi";
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

const columnOptions = [
  { key: "tour", label: "Tour" },
  { key: "dates", label: "Ngày" },
  { key: "guide", label: "Hướng dẫn viên" },
  { key: "financial", label: "Tổng quan tài chính" },
  { key: "adjustments", label: "Điều chỉnh" },
  { key: "actions", label: "Thao tác" },
] as const;

type ColumnKey = (typeof columnOptions)[number]["key"];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { tours } = useTours();
  const { masterData } = useMasterData();
  const [searchTerm, setSearchTerm] = useState("");
  const [guideFilter, setGuideFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() =>
    columnOptions.reduce(
      (acc, column) => ({ ...acc, [column.key]: true }),
      {} as Record<ColumnKey, boolean>,
    ),
  );
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnToggleRef = useRef<HTMLDivElement | null>(null);

  const handleToggleColumn = (columnKey: ColumnKey) => {
    setVisibleColumns((current) => {
      const next = { ...current, [columnKey]: !current[columnKey] };
      return Object.values(next).some(Boolean) ? next : current;
    });
  };

  const activeColumns = useMemo(
    () => columnOptions.filter((column) => visibleColumns[column.key]),
    [visibleColumns],
  );
  const emptyStateColSpan = activeColumns.length || columnOptions.length;

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

  const pendingSettlements = useMemo(() => {
    const unsettled = tours.filter(
      (tour) => Math.abs(tour.financials.differenceToAdvance) > 0,
    );
    return unsettled.sort((a, b) => {
      const aEnd = new Date(a.general.endDate).getTime();
      const bEnd = new Date(b.general.endDate).getTime();
      if (Number.isNaN(aEnd) || Number.isNaN(bEnd) || aEnd === bEnd) {
        return (
          Math.abs(b.financials.differenceToAdvance) -
          Math.abs(a.financials.differenceToAdvance)
        );
      }
      return aEnd - bEnd;
    });
  }, [tours]);

  useEffect(() => {
    if (!showColumnPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnToggleRef.current &&
        !columnToggleRef.current.contains(event.target as Node)
      ) {
        setShowColumnPicker(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowColumnPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showColumnPicker]);

  const describeDifference = (difference: number) => {
    if (difference > 0) {
      return `Hoàn về công ty ${formatCurrency(difference)}`;
    }
    if (difference < 0) {
      return `Công ty bù thêm ${formatCurrency(Math.abs(difference))}`;
    }
    return "Đã cân bằng";
  };

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
        "Mã tour": tour.general.code,
        "Khách hàng": tour.general.customerName,
        "Công ty": tour.general.clientCompany ?? "",
        "Quốc tịch": tour.general.nationality,
        "Khách": tour.general.pax,
        "Ngày bắt đầu": formatDate(tour.general.startDate),
        "Ngày kết thúc": formatDate(tour.general.endDate),
        "Hướng dẫn viên": guide?.name ?? "",
        "Tổng dịch vụ": calculateServiceTotal(tour.services),
        "Chi phí khác": calculateOtherExpenseTotal(tour.otherExpenses),
        "Phụ cấp": tour.perDiem.reduce((sum, item) => sum + item.total, 0),
        "Tổng chi phí": tour.financials.totalCost,
        "Chênh lệch với tạm ứng": tour.financials.differenceToAdvance,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách tour");
    XLSX.writeFile(workbook, "bao-cao-tour.xlsx");
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Bảng điều hành"
        description="Theo dõi các tour hiện tại, chênh lệch đã được AI điều chỉnh và kết quả tài chính."
        actions={
          <button className="primary-button" onClick={() => navigate("/new")}> 
            <FiPlus /> Tour mới
          </button>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Tour đang hoạt động"
          value={String(filteredTours.length)}
          trend={`trong tổng số ${tours.length} tour trong dữ liệu`}
          icon={<FiFilter />}
          accent="blue"
        />
        <StatCard
          label="Tour cần quyết toán"
          value={String(pendingSettlements.length)}
          trend={
            pendingSettlements[0]
              ? describeDifference(pendingSettlements[0].financials.differenceToAdvance)
              : "Tất cả tour đã cân bằng"
          }
          icon={<FiCalendar />}
          accent="green"
        />
        <StatCard
          label="Tổng chi"
          value={formatCurrency(totalSpend)}
          trend="Tổng chi bao gồm phụ cấp"
          icon={<FiDownload />}
          accent="purple"
        />
        <StatCard
          label="Điều chỉnh giá"
          value={String(totalCorrections)}
          trend="Dịch vụ đã chuẩn hóa theo Dữ liệu chuẩn"
          icon={<FiSearch />}
          accent="orange"
        />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <FiFilter /> Bộ lọc
          </div>
          <div className="filter-grid">
            <div className="filter-field">
              <label htmlFor="search">Tìm kiếm</label>
              <div className="input-with-icon">
                <FiSearch />
                <input
                  id="search"
                  type="search"
                  value={searchTerm}
                  placeholder="Mã tour, khách hàng, công ty"
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
            <div className="filter-field">
              <label htmlFor="guide">Hướng dẫn viên</label>
              <select
                id="guide"
                value={guideFilter}
                onChange={(event) => setGuideFilter(event.target.value)}
              >
                <option value="all">Tất cả hướng dẫn viên</option>
                {masterData.guides.map((guide) => (
                  <option key={guide.id} value={guide.id}>
                    {guide.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="from">Từ ngày</label>
              <input
                id="from"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div className="filter-field">
              <label htmlFor="to">Đến ngày</label>
              <input
                id="to"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
            <div className="filter-field column-toggle" ref={columnToggleRef}>
              <label htmlFor="column-picker">Cột hiển thị</label>
              <button
                id="column-picker"
                type="button"
                className="ghost-button"
                onClick={() => setShowColumnPicker((current) => !current)}
                aria-expanded={showColumnPicker}
                aria-haspopup="true"
              >
                <FiList /> Chọn cột
              </button>
              {showColumnPicker && (
                <div className="column-selector-panel">
                  {columnOptions.map((column) => (
                    <label key={column.key}>
                      <input
                        type="checkbox"
                        checked={visibleColumns[column.key]}
                        onChange={() => handleToggleColumn(column.key)}
                      />
                      {column.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button className="ghost-button" onClick={handleExport}>
              <FiDownload /> Xuất Excel
            </button>
          </div>
        </div>
        <div className="panel-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  {visibleColumns.tour && <th>Tour</th>}
                  {visibleColumns.dates && <th>Ngày</th>}
                  {visibleColumns.guide && <th>Hướng dẫn viên</th>}
                  {visibleColumns.financial && <th>Tổng quan tài chính</th>}
                  {visibleColumns.adjustments && <th>Điều chỉnh</th>}
                  {visibleColumns.actions && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filteredTours.length === 0 && (
                  <tr>
                    <td colSpan={emptyStateColSpan} className="empty-state">
                      Không có tour nào phù hợp với bộ lọc hiện tại.
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
                      {visibleColumns.tour && (
                        <td>
                          <div className="table-primary">
                            <div className="table-title">{tour.general.code}</div>
                            <div className="table-subtitle">
                              {tour.general.customerName} · {tour.general.pax} khách
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.dates && (
                        <td>
                          <div className="table-primary">
                            <div>{formatDate(tour.general.startDate)}</div>
                            <div className="table-subtitle">
                              đến {formatDate(tour.general.endDate)}
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.guide && (
                        <td>
                          <div className="table-primary">
                            <div>{guide?.name ?? "Chưa phân công"}</div>
                            <div className="table-subtitle">Tài xế: {tour.general.driverName}</div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.financial && (
                        <td>
                          <div className="table-primary">
                            <div>{formatCurrency(tour.financials.totalCost)}</div>
                            <div className="table-subtitle">
                              Tạm ứng: {formatCurrency(tour.financials.advance)}
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.adjustments && (
                        <td>
                          <span className={`tag ${corrections.length ? "warning" : "success"}`}>
                            {corrections.length ? `${corrections.length} điều chỉnh` : "Tất cả khớp"}
                          </span>
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td>
                          <button
                            className="ghost-button"
                            onClick={() => navigate(`/tour/${tour.id}`)}
                          >
                            Xem
                          </button>
                        </td>
                      )}
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
