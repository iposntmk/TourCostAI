# Hướng dẫn cấu trúc & vận hành dự án TourCostAI

## 1. Mục đích tài liệu
- Giúp developer mới hiểu nhanh thành phần chính, luồng dữ liệu và công cụ đang dùng để có thể sửa lỗi hoặc mở rộng tính năng một cách nhất quán.
- Làm checklist khi triển khai thực tế (build, lint, deploy) nhằm tránh phá vỡ các giả định có sẵn của ứng dụng.

## 2. Tổng quan kiến trúc
- Dự án hiện là một SPA React + TypeScript build bằng Vite, toàn bộ mã nguồn chạy ở thư mục `client/`. Các script `dev`, `build`, `lint`, `preview` được định nghĩa trong `package.json` và Vite cấu hình plugin React mặc định.【F:client/package.json†L6-L30】【F:client/vite.config.ts†L1-L7】
- Điểm vào ứng dụng là `main.tsx`, nơi khởi tạo `ReactDOM.createRoot` và render `<App />` bên trong `StrictMode`. Component `App` thiết lập `BrowserRouter`, bọc toàn bộ tree bởi `MasterDataProvider` và `TourProvider` rồi render layout chính và các tuyến trang.【F:client/src/main.tsx†L1-L9】【F:client/src/App.tsx†L1-L38】

## 3. Cấu trúc thư mục chính
```
TourCostAI/
├── README.md / TECH_STACK.md
└── client/
    ├── package.json / vite.config.ts / tsconfig*.json
    ├── public/ (index.html)
    └── src/
        ├── main.tsx / App.tsx / App.css / index.css
        ├── components/
        ├── contexts/
        ├── data/
        ├── pages/
        ├── types.ts
        └── utils/
```

### 3.1 Gốc repository
- `README.md`, `TECH_STACK.md` chứa mô tả nhanh dự án và chi tiết stack (phiên bản thư viện, lưu trữ, triển khai). Khi nâng cấp dependency hoặc thay đổi kiến trúc cần cập nhật song song tài liệu này.【F:TECH_STACK.md†L3-L37】

### 3.2 Thư mục `client/`
- `package.json` quản lý scripts build/dev và danh sách dependency React, React Router, React Icons, SheetJS; `devDependencies` bao gồm Vite, TypeScript, ESLint và plugin đi kèm.【F:client/package.json†L6-L30】
- `vite.config.ts` chỉ định plugin `@vitejs/plugin-react`; nếu cần thêm alias/bổ trợ khác thì mở rộng file này.【F:client/vite.config.ts†L1-L7】
- `tsconfig*.json` cấu hình TypeScript cho app chính và môi trường Node (kiểm tra trước khi đổi đường dẫn alias để tránh ảnh hưởng build).

### 3.3 Thư mục `src/`
- `main.tsx`/`App.tsx`: thiết lập router, provider, định nghĩa route `/`, `/new`, `/tour/:id`, `/master-data` và component NotFound.【F:client/src/main.tsx†L1-L9】【F:client/src/App.tsx†L1-L38】
- `components/`
  - `layout/AppLayout.tsx` dựng khung giao diện chung (header, navigation responsive, khu vực `main`).【F:client/src/components/layout/AppLayout.tsx†L5-L53】
  - `common/` chứa các building block như `PageHeader`, `StatCard` dùng lặp lại trên nhiều trang.【F:client/src/components/common/PageHeader.tsx†L3-L16】【F:client/src/components/common/StatCard.tsx†L3-L26】
- `contexts/`
  - `MasterDataContext.tsx` quản lý danh mục chuẩn (dịch vụ, hướng dẫn viên, đối tác, per diem, danh mục phụ). Dữ liệu khởi tạo lấy từ `data/defaultMasterData`, lưu/persist vào `localStorage` với key `tour-cost-ai/master-data` và expose các hàm CRUD, tiện ích tìm kiếm.【F:client/src/contexts/MasterDataContext.tsx†L43-L275】【F:client/src/data/masterData.ts†L3-L160】
  - `TourContext.tsx` quản lý danh sách tour, persist theo key `tour-cost-ai/tours`, tự động chuẩn hóa lại phụ cấp và tổng hợp tài chính mỗi lần tạo/cập nhật để đồng bộ với `MasterData`.【F:client/src/contexts/TourContext.tsx†L16-L113】
- `data/` hiện chứa `masterData.ts` khai báo dataset mặc định. Khi thay đổi cấu trúc `MasterData` phải cập nhật file này và các form liên quan.【F:client/src/data/masterData.ts†L5-L160】
- `pages/`
  - `Dashboard/`: trang tổng quan, cung cấp bộ lọc, thống kê và xuất Excel bằng `xlsx`.【F:client/src/pages/Dashboard/Dashboard.tsx†L1-L223】
  - `NewTour/`: quy trình mô phỏng upload itinerary cho Gemini, khớp dữ liệu với Master Data, tạo tour mới sau khi xác nhận.【F:client/src/pages/NewTour/NewTourPage.tsx†L22-L317】
  - `TourDetail/`: xem/chỉnh sửa tour với giao diện tab, validation, tính toán tổng hợp và thao tác xóa.【F:client/src/pages/TourDetail/TourDetailPage.tsx†L1-L246】
  - `MasterData/`: CRUD danh mục chuẩn (dịch vụ, hướng dẫn viên, đối tác, per diem, catalog chung) và nút reset về mặc định.【F:client/src/pages/MasterData/MasterDataPage.tsx†L213-L399】
- `types.ts` định nghĩa toàn bộ interface cho dịch vụ, tour, kết quả trích xuất… phải cập nhật đồng bộ khi thêm trường mới để hưởng lợi từ type checking.【F:client/src/types.ts†L1-L175】
- `utils/`
  - `calculations.ts` chuẩn hóa logic tính tổng dịch vụ, phụ cấp, chi phí khác và chuẩn hóa bảng tổng kết tài chính.【F:client/src/utils/calculations.ts†L11-L86】
  - `extraction.ts` mô phỏng phản hồi từ Google Gemini, logic match dịch vụ chuẩn và dựng danh sách dịch vụ tour từ kết quả trích xuất.【F:client/src/utils/extraction.ts†L16-L124】
  - `format.ts` cung cấp hàm format tiền tệ/ngày, chuyển đổi giá trị giữa ISO date và input HTML.【F:client/src/utils/format.ts†L1-L29】
  - `ids.ts` sinh ID ngẫu nhiên (ưu tiên `crypto.randomUUID`).【F:client/src/utils/ids.ts†L1-L4】
- `App.css`/`index.css` định nghĩa toàn bộ style thuần CSS (biến màu, layout grid/flex, responsive). Giữ nguyên class naming và biến màu để layout đồng nhất.【F:client/src/App.css†L1-L182】

## 4. Luồng dữ liệu & lưu trữ
- `MasterDataProvider` load dữ liệu mặc định, đọc `localStorage`, expose các hàm thao tác (thêm/sửa/xóa dịch vụ, hướng dẫn viên, đối tác, per diem, catalog) và tự động ghi lại `localStorage` khi state đổi.【F:client/src/contexts/MasterDataContext.tsx†L43-L223】
- `TourProvider` luôn đọc danh sách tour từ `localStorage` lúc mount, mỗi thao tác tạo/cập nhật/xóa sẽ cập nhật state và persist lại. Hàm `normalizeTour` dùng `calculatePerDiemEntries` và `normalizeFinancialSummary` để tái tính toán dựa trên dữ liệu master và itinerary hiện tại, đảm bảo thông tin tài chính luôn nhất quán.【F:client/src/contexts/TourContext.tsx†L28-L113】【F:client/src/utils/calculations.ts†L32-L86】
- Khi bổ sung trường mới vào tour hoặc master data, phải cập nhật interface trong `types.ts`, điều chỉnh default state ở các page/form và mở rộng logic chuẩn hóa tương ứng để tránh mismatch khi đọc từ `localStorage` cũ.【F:client/src/types.ts†L1-L175】【F:client/src/pages/NewTour/NewTourPage.tsx†L32-L114】

## 5. Trang chức năng & vai trò
- **Dashboard**: hiển thị thống kê, bộ lọc theo mã tour/khách hàng/hướng dẫn viên/khoảng ngày, bảng dữ liệu và nút export Excel. Bất kỳ thay đổi về shape dữ liệu tour phải đồng bộ phần mapping export.【F:client/src/pages/Dashboard/Dashboard.tsx†L24-L223】
- **New Tour**: xử lý workflow upload -> mô phỏng gọi Gemini -> khớp dịch vụ -> cho phép chỉnh sửa giá/lượng -> tạo tour mới (gọi `createTour`). Đây là điểm gắn API thật trong tương lai: thay `simulateGeminiExtraction` bằng call thực tế nhưng vẫn phải trả về `ExtractionResult` đúng cấu trúc để giữ logic hiện tại.【F:client/src/pages/NewTour/NewTourPage.tsx†L67-L245】【F:client/src/utils/extraction.ts†L16-L124】
- **Tour Detail**: cho phép chỉnh sửa chi tiết tour ở chế độ tab, validate dữ liệu trước khi lưu, tính toán tổng tiền từng hạng mục và hiển thị badge chênh lệch. Mọi thao tác lưu dùng `updateTour`, do đó các thay đổi business rule nên đặt ở `normalizeTour`/`calculate*` để áp dụng đồng nhất.【F:client/src/pages/TourDetail/TourDetailPage.tsx†L29-L246】【F:client/src/contexts/TourContext.tsx†L60-L113】
- **Master Data**: quản lý danh mục chuẩn với form tạo nhanh, modal inline edit và nút reset về bộ dữ liệu mặc định. Khi thêm loại danh mục mới cần bổ sung trường trong context lẫn trang này.【F:client/src/pages/MasterData/MasterDataPage.tsx†L213-L399】【F:client/src/contexts/MasterDataContext.tsx†L87-L223】

## 6. Kiểu dáng & component dùng chung
- `AppLayout`, `PageHeader`, `StatCard` là các component nền tảng tái sử dụng trong toàn bộ flow; giữ phong cách CSS hiện có để bảo toàn trải nghiệm thống nhất.【F:client/src/components/layout/AppLayout.tsx†L5-L53】【F:client/src/components/common/PageHeader.tsx†L3-L16】【F:client/src/components/common/StatCard.tsx†L3-L26】
- Style được định nghĩa trong `App.css` với biến màu, shadow, radius, layout responsive. Khi mở rộng UI hãy tái sử dụng class hiện hữu hoặc bổ sung biến mới tại `:root` để tránh hardcode.【F:client/src/App.css†L1-L182】

## 7. Công cụ & thư viện
- React 19, React Router 7, React Icons (Feather icons) và SheetJS (xlsx) là dependency chính ở runtime. Bộ ESLint 9 + plugin React + TypeScript hỗ trợ linting trong quá trình dev/build.【F:client/package.json†L12-L30】
- File `TECH_STACK.md` mô tả chi tiết hơn từng nhóm công nghệ, cách lưu trữ `localStorage` và triết lý styling — cập nhật file này khi có thay đổi lớn để đảm bảo tài liệu nhất quán.【F:TECH_STACK.md†L3-L37】

## 8. Quy trình phát triển & kiểm thử
1. `cd client && npm install` khi thiết lập môi trường mới.
2. Trong quá trình làm việc:
   - `npm run dev`: khởi chạy Vite dev server.
   - `npm run lint`: kiểm tra lint TypeScript/React.
   - `npm run build`: compile TypeScript và build static assets (`dist/`).
   - `npm run preview`: kiểm thử bản build cục bộ trước khi deploy.
3. Khi commit thay đổi business logic, nhớ bổ sung/điều chỉnh test thủ công tương ứng (ví dụ tạo tour mới, chỉnh sửa tour).

## 9. Ghi chú mở rộng & triển khai
- **Lưu trữ**: vì dùng `localStorage`, mọi thay đổi breaking trong schema cần hàm migrate hoặc clear storage để tránh lỗi parse ở `loadMasterData`/`loadTours` (hiện bám theo fallback mặc định).【F:client/src/contexts/MasterDataContext.tsx†L43-L59】【F:client/src/contexts/TourContext.tsx†L28-L41】
- **Sinh mã**: luôn dùng `generateId` khi tạo entity mới (dịch vụ, lịch trình, chi phí…) để thống nhất cách tạo ID trên cả browser hỗ trợ `crypto.randomUUID`.【F:client/src/utils/ids.ts†L1-L4】【F:client/src/pages/NewTour/NewTourPage.tsx†L86-L210】
- **Chuẩn hóa số liệu**: mọi thay đổi liên quan tới tính toán chi phí phải đi qua `calculate*` hoặc `normalizeFinancialSummary` để đảm bảo Dashboard, Tour Detail và báo cáo Excel hiển thị nhất quán.【F:client/src/utils/calculations.ts†L16-L86】【F:client/src/pages/Dashboard/Dashboard.tsx†L55-L96】
- **Tích hợp AI thực tế**: module `simulateGeminiExtraction` hiện trả về dữ liệu giả lập. Khi kết nối API thật, cần map response về `ExtractionResult` rồi vẫn tái sử dụng `matchExtractedServices`/`buildTourServices` để giữ logic so khớp giá với Master Data.【F:client/src/utils/extraction.ts†L16-L124】
- **Tài liệu**: luôn đồng bộ thay đổi kiến trúc vào `TECH_STACK.md` và file này để người tiếp nhận có thể nắm hệ thống nhanh chóng.【F:TECH_STACK.md†L3-L37】
