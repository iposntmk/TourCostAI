import type { ExtractionResult, MasterData } from "../types";

const NS = (import.meta.env.VITE_STORAGE_NAMESPACE as string) || "tourcostai";

export const apiKeyStorageKey = `${NS}/ai-api-key`;
export const apiModeStorageKey = `${NS}/ai-api-mode`; // 'mock' | 'live'

export function saveApiKey(key: string) {
  try {
    localStorage.setItem(apiKeyStorageKey, key);
  } catch {
    // ignore
  }
}

export function loadApiKey(): string {
  try {
    return localStorage.getItem(apiKeyStorageKey) ?? "";
  } catch {
    return "";
  }
}

export function saveApiMode(mode: "mock" | "live") {
  try {
    localStorage.setItem(apiModeStorageKey, mode);
  } catch {
    // ignore
  }
}

export function loadApiMode(): "mock" | "live" {
  try {
    return (localStorage.getItem(apiModeStorageKey) as "mock" | "live") ||
      ((import.meta.env.VITE_API_MODE as "mock" | "live") || "mock");
  } catch {
    return (import.meta.env.VITE_API_MODE as "mock" | "live") || "mock";
  }
}

/**
 * Real Gemini AI extraction using Google's Generative AI API
 */
export async function extractWithAI(
  file: File,
  masterData: MasterData,
  apiKey: string,
  customPrompt?: string,
): Promise<ExtractionResult> {
  if (!apiKey) {
    throw new Error("API key is required for live extraction");
  }

  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    // Prepare the prompt for Gemini
    const prompt = customPrompt || createExtractionPrompt(masterData);
    
    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: file.type,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!extractedText) {
      console.error("Gemini response:", data);
      throw new Error("Gemini không trả về nội dung nào từ hình ảnh. Có thể hình ảnh không rõ ràng hoặc không chứa text.");
    }

    console.log("Gemini extracted text:", extractedText.substring(0, 500) + "...");
    
    // Parse the extracted text into structured data
    return parseExtractedData(extractedText, masterData);
  } catch (error) {
    console.error("Gemini API extraction failed:", error);
    throw new Error(`Extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Convert file to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Create a comprehensive prompt for tour data extraction
 */
function createExtractionPrompt(masterData: MasterData): string {
  const currentYear = new Date().getFullYear();
  const servicesList = masterData.services
    .map(s => `- ${s.name}: ${s.price.toLocaleString()} VND`)
    .join("\n");
  const guidesList = masterData.guides.map(g => `- ${g.name}`).join("\n");
  const nationalitiesList = masterData.catalogs.nationalities.join(", ");

  return `
Bạn là một chuyên gia phân tích chương trình tour du lịch từ bảng CSV, Excel, hoặc tài liệu có tiếng Việt có dấu.

NHIỆM VỤ: Phân tích hình ảnh này và trích xuất thông tin tour một cách chính xác theo định dạng JSON cụ thể.

QUAN TRỌNG:
- Hình ảnh là chương trình tour chứa đầy đủ thông tin tour
- Tất cả text có thể là tiếng Việt có dấu (ă, â, ê, ô, ơ, ư, đ)
- Đọc được các ký tự đặc biệt: ₫, VND, USD, %, số thập phân
- CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT THÊM

ĐỊNH DẠNG YÊU CẦU:
- date = dd/mm/${currentYear}
- number = 0 (nếu không đề cập)
- tiền tệ = 0 (nếu không đề cập) và có dấu '.' để phân tách hàng nghìn
- string = "" (nếu không đề cập)

Yêu cầu trả về dữ liệu theo định dạng JSON chính xác như sau:

{
  "thong_tin_chung": {
    "ma_tour": "mã tour",
    "ten_cong_ty": "tên công ty = khách sạn: [tên công ty] book",
    "ten_guide": "tên guide (chọn từ: ${guidesList})",
    "ten_khach": "tên khách",
    "quoc_tich_khach": "quốc tịch khách (chọn từ: ${nationalitiesList})",
    "so_luong_khach": số_lượng_khách,
    "ten_lai_xe": "tên lái xe",
    "so_dien_thoai_lai_xe": "số điện thoại lái xe",
    "so_dien_thoai_khach": "số điện thoại khách"
  },
  "danh_sach_ngay_tham_quan": [
    {
      "ngay_tham_quan": "dd/mm/${currentYear}",
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
      "ten_chi_phi": "tên chi phí (tham khảo dịch vụ chuẩn: ${servicesList})",
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

HƯỚNG DẪN PHÂN TÍCH:
1. Đọc toàn bộ text trong hình ảnh, kể cả tiếng Việt có dấu.
2. Ưu tiên khớp tên dịch vụ với danh sách chuẩn: ${servicesList}
3. Hướng dẫn viên nên nằm trong danh sách: ${guidesList}
4. Nếu thiếu thông tin, điền giá trị mặc định theo quy định.
5. Chỉ trả về JSON hợp lệ, không có giải thích thêm.
`;
}

/**
 * Parse extracted text into structured data
 */
function parseExtractedData(extractedText: string, masterData: MasterData): ExtractionResult {
  try {
    console.log("Parsing extracted text:", extractedText);
    
    // Try to extract JSON from the response
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response. Full text:", extractedText);
      throw new Error(`Gemini không trả về dữ liệu JSON hợp lệ. 
      
Nội dung Gemini trả về: "${extractedText.substring(0, 200)}..."

Có thể:
- Hình ảnh không rõ ràng hoặc không chứa thông tin tour
- Gemini không thể đọc được tiếng Việt có dấu
- Prompt cần được cải thiện để Gemini hiểu rõ hơn
- Hình ảnh là CSV/Excel cần được chuyển đổi sang định dạng khác`);
    }

    const jsonString = jsonMatch[0];
    console.log("Found JSON:", jsonString);
    
    const parsedData = JSON.parse(jsonString);
    
    const result = normalizeExtractionResult(parsedData, masterData);

    const hasServices = result.services.some(service => service.rawName && service.price > 0);
    const hasItinerary = result.itinerary.some(item => item.location || item.date);
    const hasGeneralInfo = Boolean(
      result.general.tourCode ||
        result.general.customerName ||
        result.general.pax > 0 ||
        result.general.guideName
    );

    if (!hasServices && !hasItinerary && !hasGeneralInfo) {
      throw new Error("Gemini không thể trích xuất thông tin có ý nghĩa từ hình ảnh. Hình ảnh có thể không chứa thông tin tour hoặc chất lượng hình ảnh quá kém.");
    }

    if (result.services.length === 0) {
      console.warn("No services extracted from image");
    }
    if (result.itinerary.length === 0) {
      console.warn("No itinerary extracted from image");
    }

    return result;
  } catch (error) {
    console.error("Failed to parse extracted data:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Không thể xử lý dữ liệu từ Gemini. Vui lòng thử lại với hình ảnh rõ ràng hơn.");
  }
}

function normalizeExtractionResult(parsedData: any, masterData: MasterData): ExtractionResult {
  const general = buildGeneralInfo(parsedData, masterData);
  const services = buildServices(parsedData, general.pax);
  const itinerary = buildItinerary(parsedData);
  const otherExpenses = buildOtherExpenses(parsedData);

  const advance = toNumber(parsedData.advance ?? parsedData.tam_ung);
  const collectionsForCompany = toNumber(
    parsedData.collectionsForCompany ??
      parsedData.collectionForCompany ??
      parsedData.thu_ho_cong_ty ??
      parsedData.thu_ho ??
      parsedData.collections
  );

  const companyTip = extractTip(parsedData);

  const result: ExtractionResult = {
    general,
    services,
    itinerary,
    otherExpenses,
  };

  if (advance) {
    result.advance = advance;
  }
  if (collectionsForCompany) {
    result.collectionsForCompany = collectionsForCompany;
  }
  if (companyTip) {
    result.companyTip = companyTip;
  }

  return result;
}

function buildGeneralInfo(parsedData: any, masterData: MasterData): ExtractionResult["general"] {
  const fallbackNationality = masterData.catalogs.nationalities[0] || "";
  const general = parsedData.general ?? {};
  const thongTin = parsedData.thong_tin_chung ?? {};

  const itineraryDates = extractDatesFromItinerary(parsedData);

  return {
    tourCode: general.tourCode ?? thongTin.ma_tour ?? "",
    customerName: general.customerName ?? thongTin.ten_khach ?? "",
    clientCompany: general.clientCompany ?? thongTin.ten_cong_ty ?? "",
    nationality: general.nationality ?? thongTin.quoc_tich_khach ?? fallbackNationality,
    pax: toNumber(general.pax ?? thongTin.so_luong_khach),
    startDate: general.startDate ?? itineraryDates.startDate ?? "",
    endDate: general.endDate ?? itineraryDates.endDate ?? "",
    guideName: general.guideName ?? thongTin.ten_guide ?? "",
    driverName: general.driverName ?? thongTin.ten_lai_xe ?? "",
    notes: general.notes ?? "",
  };
}

function buildServices(parsedData: any, pax: number): ExtractionResult["services"] {
  const baseServices = Array.isArray(parsedData.services)
    ? parsedData.services.map((service: any) => ({
      rawName: service.rawName || "",
      quantity: toNumber(service.quantity) || pax || 1,
      price: toNumber(service.price),
      notes: service.notes || "",
    }))
    : [];

  const chiPhiServices = Array.isArray(parsedData.danh_sach_chi_phi)
    ? parsedData.danh_sach_chi_phi.map((item: any, index: number) => ({
      rawName: item.ten_chi_phi || `Chi phí ${index + 1}`,
      quantity: pax || 1,
      price: toNumber(item.so_tien_per_pax),
      notes: "Chi phí theo pax",
    }))
    : [];

  const lunchServices = Array.isArray(parsedData.an?.an_trua)
    ? parsedData.an.an_trua.map((item: any, index: number) => ({
      rawName: item.ten_mon ? `Ăn trưa - ${item.ten_mon}` : `Ăn trưa ${index + 1}`,
      quantity: pax || 1,
      price: toNumber(item.so_tien_per_pax),
      notes: "Bữa trưa per pax",
    }))
    : [];

  const dinnerServices = Array.isArray(parsedData.an?.an_toi)
    ? parsedData.an.an_toi.map((item: any, index: number) => ({
      rawName: item.ten_mon ? `Ăn tối - ${item.ten_mon}` : `Ăn tối ${index + 1}`,
      quantity: pax || 1,
      price: toNumber(item.so_tien_per_pax),
      notes: "Bữa tối per pax",
    }))
    : [];

  return [...baseServices, ...chiPhiServices, ...lunchServices, ...dinnerServices].filter(
    service => service.rawName || service.price > 0
  );
}

function buildItinerary(parsedData: any): ExtractionResult["itinerary"] {
  if (Array.isArray(parsedData.itinerary) && parsedData.itinerary.length > 0) {
    return parsedData.itinerary.map((item: any, index: number) => ({
      day: toNumber(item.day) || index + 1,
      date: normalizeDate(item.date),
      location: item.location || "",
      activities: Array.isArray(item.activities) ? item.activities : [],
    }));
  }

  const ngayThamQuan = Array.isArray(parsedData.danh_sach_ngay_tham_quan)
    ? parsedData.danh_sach_ngay_tham_quan
    : [];
  const diaDiems = Array.isArray(parsedData.danh_sach_dia_diem)
    ? parsedData.danh_sach_dia_diem.map((item: any) => item.dia_diem_tham_quan).filter(Boolean)
    : [];

  return ngayThamQuan.map((item: any, index: number) => ({
    day: index + 1,
    date: normalizeDate(item.ngay_tham_quan ?? item.date ?? item.ngay),
    location: item.tinh || item.dia_diem || "",
    activities: diaDiems.length > 0 ? diaDiems : [],
  }));
}

function buildOtherExpenses(parsedData: any): ExtractionResult["otherExpenses"] {
  if (Array.isArray(parsedData.otherExpenses)) {
    return parsedData.otherExpenses.map((expense: any) => ({
      description: expense.description || "",
      amount: toNumber(expense.amount),
      date: normalizeDate(expense.date),
      notes: expense.notes || "",
    }));
  }

  return [];
}

function extractTip(parsedData: any): number {
  if (typeof parsedData.companyTip !== "undefined") {
    return toNumber(parsedData.companyTip);
  }

  if (parsedData.tip && typeof parsedData.tip === "object") {
    const tipObj = parsedData.tip;
    if (tipObj.co_tip === false || tipObj.co_tip === "false") {
      return 0;
    }
    return toNumber(tipObj.so_tien_tip);
  }

  return 0;
}

function extractDatesFromItinerary(parsedData: any): { startDate?: string; endDate?: string } {
  const allDates: string[] = [];

  if (Array.isArray(parsedData.itinerary)) {
    parsedData.itinerary.forEach((item: any) => {
      const normalized = normalizeDate(item.date);
      if (normalized) {
        allDates.push(normalized);
      }
    });
  }

  if (Array.isArray(parsedData.danh_sach_ngay_tham_quan)) {
    parsedData.danh_sach_ngay_tham_quan.forEach((item: any) => {
      const normalized = normalizeDate(item.ngay_tham_quan ?? item.date ?? item.ngay);
      if (normalized) {
        allDates.push(normalized);
      }
    });
  }

  if (allDates.length === 0) {
    return {};
  }

  const sorted = allDates.sort();
  return {
    startDate: sorted[0],
    endDate: sorted[sorted.length - 1],
  };
}

function normalizeDate(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const match = trimmed.match(/(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/);
  if (!match) {
    return trimmed;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const rawYear = match[3];

  const now = new Date();
  let year = rawYear ? Number(rawYear) : now.getFullYear();
  if (year < 100) {
    year += 2000;
  }

  if (!day || !month || !year) {
    return "";
  }

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value
      .replace(/[^0-9,.-]/g, "")
      .replace(/,(?=\d{3}(?:\D|$))/g, "")
      .replace(/\.(?=\d{3}(?:\D|$))/g, "")
      .replace(/,/g, ".");

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return 0;
}
