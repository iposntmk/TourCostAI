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
          label="Chuyến khởi hành sắp tới"
          value={String(upcomingTours.length)}
          trend={
            upcomingTours[0]
              ? `Chuyến tiếp theo: ${formatDate(upcomingTours[0].general.startDate)}`
              : "Không có tour sắp khởi hành"
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
                  <th>Tour</th>
                  <th>Ngày</th>
                  <th>Hướng dẫn viên</th>
                  <th>Tổng quan tài chính</th>
                  <th>Điều chỉnh</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTours.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
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
                      <td>
                        <div className="table-primary">
                          <div className="table-title">{tour.general.code}</div>
                          <div className="table-subtitle">
                            {tour.general.customerName} · {tour.general.pax} khách
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="table-primary">
                          <div>{formatDate(tour.general.startDate)}</div>
                          <div className="table-subtitle">
                            đến {formatDate(tour.general.endDate)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="table-primary">
                          <div>{guide?.name ?? "Chưa phân công"}</div>
                          <div className="table-subtitle">Tài xế: {tour.general.driverName}</div>
                        </div>
                      </td>
                      <td>
                        <div className="table-primary">
                          <div>{formatCurrency(tour.financials.totalCost)}</div>
                          <div className="table-subtitle">
                            Tạm ứng: {formatCurrency(tour.financials.advance)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`tag ${corrections.length ? "warning" : "success"}`}>
                          {corrections.length ? `${corrections.length} điều chỉnh` : "Tất cả khớp"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="ghost-button"
                          onClick={() => navigate(`/tour/${tour.id}`)}
                        >
                          Xem
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
