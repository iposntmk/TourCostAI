# Tính năng Gợi ý thông tin chung cho Gemini

## Tổng quan
Component `GeminiSuggestionsGrid` cho phép người dùng định nghĩa và quản lý các trường dữ liệu sẽ được truyền vào Gemini AI để chuẩn hóa thông tin từ hình ảnh tour.

## Tính năng chính

### 1. Quản lý trường động
- **Thêm trường mới**: Cho phép thêm các trường tùy chỉnh ngoài các trường mặc định
- **Xóa trường**: Xóa các trường tùy chỉnh không cần thiết
- **Chỉnh sửa giá trị**: Sửa đổi giá trị của từng trường trực tiếp

### 2. Mẫu trường có sẵn
Cung cấp 3 bộ mẫu trường thông dụng:
- **✈️ Thông tin chuyến bay**: Số chuyến bay, hãng bay, giờ khởi hành
- **🏨 Thông tin khách sạn**: Tên khách sạn, loại phòng, ngày check-in/out
- **📋 Thông tin đặt chỗ**: Mã booking, mã xác nhận, tình trạng thanh toán

### 3. Import/Export cấu hình
- **Xuất cấu hình**: Lưu các trường tùy chỉnh ra file JSON
- **Nhập cấu hình**: Tải các trường từ file JSON đã lưu trước đó
- Cho phép chia sẻ và tái sử dụng cấu hình giữa các dự án

### 4. Validation và thông báo
- Kiểm tra định dạng key (phải bắt đầu bằng chữ cái, chỉ chứa chữ/số/gạch dưới)
- Kiểm tra trùng lặp key
- Thông báo lỗi và thành công tự động ẩn sau 3 giây
- Hiển thị tổng quan: số trường đã điền, số trường tùy chỉnh

### 5. Các loại dữ liệu hỗ trợ
- **Text**: Văn bản thông thường
- **Number**: Số nguyên hoặc thập phân
- **Date**: Ngày tháng (với date picker)
- **Select**: Danh sách lựa chọn (cho nationality, guideName)

### 6. UI/UX cải tiến
- Giao diện trực quan với màu sắc và icon rõ ràng
- Tooltip hướng dẫn cho các trường quan trọng
- Animation mượt mà khi thêm/xóa trường
- Responsive design cho mobile
- Badge hiển thị trạng thái (Tùy chọn, Tùy chỉnh)
- Highlighting cho các hàng có giá trị

## Cấu trúc dữ liệu

### ExtractionGeneralInfo
```typescript
export interface ExtractionGeneralInfo {
  tourCode: string;
  customerName: string;
  clientCompany?: string;
  pax: number;
  nationality: string;
  startDate: string;
  endDate: string;
  guideName: string;
  driverName: string;
  notes?: string;
  // Cho phép thêm các trường động
  [key: string]: string | number | undefined;
}
```

### FieldDefinition
```typescript
interface FieldDefinition {
  key: string;                    // Mã định danh trường
  label: string;                  // Nhãn hiển thị
  description: string;             // Mô tả chi tiết
  type: "text" | "number" | "date" | "select";
  options?: string[];              // Cho select
  optional?: boolean;              // Trường không bắt buộc
  isCustom?: boolean;              // Trường do user tạo
}
```

## Hướng dẫn sử dụng

### Thêm trường mới
1. Nhấn nút "Thêm trường mới"
2. Điền thông tin:
   - Key: Mã định danh (vd: `bookingId`)
   - Nhãn: Tên hiển thị (vd: "Mã Booking")
   - Mô tả: Giải thích cho Gemini AI
   - Loại dữ liệu: Text/Number/Date
3. Chọn "Trường tùy chọn" nếu không bắt buộc
4. Nhấn "Thêm trường"

### Sử dụng mẫu có sẵn
1. Nhấn "Thêm từ mẫu"
2. Chọn một trong các mẫu:
   - Thông tin chuyến bay
   - Thông tin khách sạn
   - Thông tin đặt chỗ
3. Các trường sẽ tự động được thêm

### Export/Import cấu hình
**Export:**
1. Nhấn "Xuất cấu hình"
2. File JSON sẽ được tải về với tên `custom-fields-[date].json`

**Import:**
1. Nhấn "Nhập cấu hình"
2. Chọn file JSON đã export trước đó
3. Các trường sẽ được thêm (bỏ qua nếu trùng key)

## Tích hợp với Gemini AI

Khi chạy trích xuất, các trường có giá trị sẽ được truyền vào `buildGeneralInfo` để Gemini AI ưu tiên khi chuẩn hóa dữ liệu:

```javascript
// Ví dụ dữ liệu được truyền
const generalOverrides = {
  tourCode: "SGN-HAN-2024",
  customerName: "Nguyễn Văn A",
  pax: 20,
  nationality: "Việt Nam",
  // Các trường tùy chỉnh
  bookingId: "BK123456",
  flightNumber: "VN123",
  hotelName: "Hilton Hanoi"
};
```

## Lưu ý
- Trường với key đã tồn tại không thể thêm lại
- Key phải bắt đầu bằng chữ cái và chỉ chứa chữ, số, gạch dưới
- Các trường tùy chỉnh có thể xóa, trường mặc định không thể xóa
- Giá trị để trống sẽ cho phép AI tự suy luận từ hình ảnh