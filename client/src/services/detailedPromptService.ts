import { savePrompt } from "./promptService";
import type { Prompt } from "../types/prompt";

/**
 * Create a detailed prompt for Vietnamese tour program extraction
 */
export async function createDetailedPrompt(): Promise<string> {
  const detailedPrompt: Omit<Prompt, "id" | "createdAt" | "updatedAt"> = {
    name: "Prompt chi tiết cho chương trình tour",
    content: `Bạn là một chuyên gia phân tích chương trình tour du lịch từ bảng CSV, Excel, hoặc tài liệu có tiếng Việt có dấu.

NHIỆM VỤ: Phân tích hình ảnh này và trích xuất thông tin tour một cách chính xác theo định dạng JSON cụ thể.

QUAN TRỌNG:
- Hình ảnh là chương trình tour chứa đầy đủ thông tin tour
- Tất cả text có thể là tiếng Việt có dấu (ă, â, ê, ô, ơ, ư, đ)
- Đọc được các ký tự đặc biệt: ₫, VND, USD, %, số thập phân
- CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT THÊM

ĐỊNH DẠNG YÊU CẦU:
- date = dd/mm/yyyy (yyyy = năm hiện tại)
- number = 0 (nếu không đề cập)
- tiền tệ = 0 (nếu không đề cập) và có dấu '.' để phân tách hàng nghìn
- string = "" (nếu không đề cập)

Yêu cầu trả về dữ liệu theo định dạng JSON chính xác như sau:

{
  "thong_tin_chung": {
    "ma_tour": "mã tour",
    "ten_cong_ty": "tên công ty = khách sạn: [tên công ty] book",
    "ten_guide": "tên guide",
    "ten_khach": "tên khách",
    "quoc_tich_khach": "quốc tịch khách (nếu không đề cập thì dựa vào số điện thoại khách để suy ra)",
    "so_luong_khach": số_lượng_khách,
    "ten_lai_xe": "tên lái xe",
    "so_dien_thoai_lai_xe": "số điện thoại lái xe",
    "so_dien_thoai_khach": "số điện thoại khách (lấy trong cụm 'số khách/ [số điện thoại khách]')"
  },
  "danh_sach_ngay_tham_quan": [
    {
      "ngay_tham_quan": "dd/mm/yyyy",
      "tinh": "tên tỉnh"
    }
  ],
  "danh_sach_dia_diem": [
    {
      "dia_diem_tham_quan": "tên địa điểm tham quan"
    }
  ],
  "danh_sach_chi_phi": [
    {
      "ten_chi_phi": "tên chi phí",
      "so_tien_per_pax": số_tiền_per_pax
    }
  ],
  "an": {
    "an_trua": [
      {
        "ten_mon": "tên món ăn trưa",
        "so_tien_per_pax": số_tiền_per_pax
      }
    ],
    "an_toi": [
      {
        "ten_mon": "tên món ăn tối",
        "so_tien_per_pax": số_tiền_per_pax
      }
    ]
  },
  "tip": {
    "co_tip": true/false,
    "so_tien_tip": số_tiền_tip
  }
}

HƯỚNG DẪN PHÂN TÍCH CHI TIẾT:
1. Đọc tất cả text trong hình ảnh, bao gồm tiếng Việt có dấu
2. Tìm mã tour (thường ở đầu trang hoặc tiêu đề)
3. Tìm tên công ty và format thành "khách sạn: [tên công ty] book"
4. Tìm tên hướng dẫn viên (guide)
5. Tìm tên khách hàng
6. Tìm quốc tịch khách, nếu không có thì dựa vào số điện thoại để suy ra
7. Tìm số lượng khách (PAX/pax)
8. Tìm tên lái xe và số điện thoại lái xe
9. Tìm số điện thoại khách trong cụm "số khách/ [số điện thoại khách]"
10. Tìm danh sách ngày tham quan (cột ngày) với định dạng dd/mm/yyyy
11. Tìm các địa điểm tham quan (cột tham quan)
12. Tìm chi phí (cột tham quan) với format "tên - số tiền/1 pax"
13. Tìm ăn trưa (cột ăn trưa) với format "tên - số tiền/1 pax"
14. Tìm ăn tối (cột ăn tối) với format "tên - số tiền/1 pax"
15. Tìm tip từ văn phòng nếu có đề cập với format "tip - số tiền"

Lưu ý quan trọng:
1. CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CÓ TEXT THÊM
2. Ngày tháng phải đúng định dạng dd/mm/yyyy với năm hiện tại
3. Số tiền phải có dấu '.' để phân tách hàng nghìn
4. Nếu không tìm thấy thông tin nào, để giá trị mặc định theo định dạng
5. Đọc được tiếng Việt có dấu: ă, â, ê, ô, ơ, ư, đ
6. Có thể đọc bảng CSV, Excel, PDF
7. Chú ý các từ khóa: tour code, guide, pax, nationality, driver, phone, date, attractions, costs, lunch, dinner, tip
8. Phân tích kỹ hình ảnh để trích xuất đầy đủ thông tin`,
    description: "Prompt chi tiết cho việc trích xuất dữ liệu tour với định dạng JSON cụ thể",
    isActive: true
  };

  return await savePrompt(detailedPrompt);
}