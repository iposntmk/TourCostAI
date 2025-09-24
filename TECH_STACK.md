# Công nghệ, thư viện và cách lưu trữ của ứng dụng

## Công nghệ & công cụ build
- Ứng dụng front-end được dựng bằng Vite 7 kết hợp plugin `@vitejs/plugin-react`, chạy trên React 19 và TypeScript (phiên bản ~5.8).
- Bộ công cụ phát triển gồm ESLint 9, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` để lint mã TypeScript/React trong quá trình build.

## Thư viện giao diện & điều hướng
- React DOM làm nền tảng kết xuất giao diện, kết hợp `react-router-dom` để định tuyến trang (Dashboard, Tour mới, chi tiết tour, Master Data) và bố cục `AppLayout`.
- `react-icons/fi` cung cấp bộ biểu tượng Feather cho layout, dashboard, form tạo tour, trang Master Data và chi tiết tour.

## Quản lý dữ liệu & nghiệp vụ
- Hai React Context (`MasterDataProvider`, `TourProvider`) gói quanh toàn bộ router để chia sẻ state master data và danh sách tour, đồng thời chuẩn hoá tính toán phụ cấp, tài chính khi tạo/cập nhật tour.
- Bộ dữ liệu chuẩn ban đầu (`defaultMasterData`) được khai báo tĩnh trong `src/data/masterData.ts` nhằm seed danh sách dịch vụ, hướng dẫn viên, đối tác, bảng phụ cấp khi chưa có dữ liệu người dùng.

## Lưu trữ phía client
- State master data và tour được lưu/persist vào `window.localStorage` với hai khóa `tour-cost-ai/master-data` và `tour-cost-ai/tours`; khi khởi tạo context sẽ đọc dữ liệu từ localStorage, fallback về mặc định nếu không có hoặc lỗi parse.

## Tiện ích xử lý dữ liệu & giả lập AI
- Trang Dashboard sử dụng thư viện `xlsx` (SheetJS) để chuyển dữ liệu tour đã lọc thành workbook Excel và cho tải về file `bao-cao-tour.xlsx`.
- Module `simulateGeminiExtraction` mô phỏng kết quả đọc itinerary từ Gemini, sinh dữ liệu tổng quan, dịch vụ, lịch trình, chi phí phụ trợ và hỗ trợ khớp với Master Data để đánh giá chênh lệch.

## Kiểu dáng & asset
- Giao diện được style bằng các file CSS thuần (`App.css`, `index.css`), tự định nghĩa biến màu, shadow, border-radius và layout responsive, không dùng framework CSS bên ngoài.

## Công cụ hỗ trợ khác
- Cấu hình `npm` scripts cho dev server (`vite`), build (`tsc -b` + `vite build`), preview và lint giúp chạy/kiểm tra dự án trong môi trường phát triển và khi build sản phẩm.
