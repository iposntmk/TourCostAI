import type { ExtractionResult, MasterData } from "../types";
import { simulateGeminiExtraction } from "../utils/extraction";

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
  const servicesList = masterData.services.map(s => `- ${s.name}: ${s.price.toLocaleString()} VND`).join("\n");
  const guidesList = masterData.guides.map(g => `- ${g.name}`).join("\n");
  const nationalitiesList = masterData.catalogs.nationalities.join(", ");

  return `
Bạn là một chuyên gia phân tích chương trình tour du lịch. Hãy phân tích hình ảnh này và trích xuất thông tin tour một cách chính xác.

Yêu cầu trả về dữ liệu theo định dạng JSON chính xác như sau:

{
  "general": {
    "tourCode": "mã tour (vd: SGN-DAD-2406)",
    "customerName": "tên khách hàng",
    "clientCompany": "tên công ty khách hàng",
    "nationality": "quốc tịch (chọn từ: ${nationalitiesList})",
    "pax": số_khách,
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD", 
    "guideName": "tên hướng dẫn viên (chọn từ: ${guidesList})",
    "driverName": "tên tài xế",
    "notes": "ghi chú vận hành"
  },
  "services": [
    {
      "rawName": "tên dịch vụ trong tài liệu",
      "quantity": số_lượng,
      "price": giá_tiền,
      "notes": "ghi chú"
    }
  ],
  "itinerary": [
    {
      "day": số_ngày,
      "date": "YYYY-MM-DD",
      "location": "địa điểm",
      "activities": ["hoạt động 1", "hoạt động 2"]
    }
  ],
  "otherExpenses": [
    {
      "description": "mô tả chi phí",
      "amount": số_tiền,
      "date": "YYYY-MM-DD",
      "notes": "ghi chú"
    }
  ],
  "advance": số_tiền_tạm_ứng,
  "collectionsForCompany": số_tiền_thu_hộ,
  "companyTip": số_tiền_tip_công_ty
}

DANH SÁCH DỊCH VỤ CHUẨN:
${servicesList}

DANH SÁCH HƯỚNG DẪN VIÊN:
${guidesList}

Lưu ý quan trọng:
1. Chỉ trả về JSON hợp lệ, không có text thêm
2. Nếu không tìm thấy thông tin nào, để giá trị null hoặc ""
3. Ngày tháng phải đúng định dạng YYYY-MM-DD
4. Giá tiền phải là số nguyên (không có dấu phẩy)
5. Tên dịch vụ và hướng dẫn viên phải khớp với danh sách chuẩn
6. Phân tích kỹ hình ảnh để trích xuất đầy đủ thông tin
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
    
    // Validate extracted data quality
    const extractedServices = parsedData.services || [];
    const extractedItinerary = parsedData.itinerary || [];
    const extractedGeneral = parsedData.general || {};
    
    // Check if we got meaningful data
    const hasServices = extractedServices.length > 0 && extractedServices.some((s: any) => s.rawName && s.price > 0);
    const hasItinerary = extractedItinerary.length > 0 && extractedItinerary.some((i: any) => i.location && i.activities?.length > 0);
    const hasGeneralInfo = extractedGeneral.tourCode || extractedGeneral.customerName || extractedGeneral.pax > 0;
    
    if (!hasServices && !hasItinerary && !hasGeneralInfo) {
      throw new Error("Gemini không thể trích xuất thông tin có ý nghĩa từ hình ảnh. Hình ảnh có thể không chứa thông tin tour hoặc chất lượng hình ảnh quá kém.");
    }
    
    // Validate and clean the data
    const result = {
      general: {
        tourCode: extractedGeneral.tourCode || "",
        customerName: extractedGeneral.customerName || "",
        clientCompany: extractedGeneral.clientCompany || "",
        nationality: extractedGeneral.nationality || masterData.catalogs.nationalities[0] || "",
        pax: Number(extractedGeneral.pax) || 0,
        startDate: extractedGeneral.startDate || "",
        endDate: extractedGeneral.endDate || "",
        guideName: extractedGeneral.guideName || "",
        driverName: extractedGeneral.driverName || "",
        notes: extractedGeneral.notes || "",
      },
      services: extractedServices.map((service: any) => ({
        rawName: service.rawName || "",
        quantity: Number(service.quantity) || 1,
        price: Number(service.price) || 0,
        notes: service.notes || "",
      })),
      itinerary: extractedItinerary.map((item: any) => ({
        day: Number(item.day) || 1,
        date: item.date || "",
        location: item.location || "",
        activities: Array.isArray(item.activities) ? item.activities : [],
      })),
      otherExpenses: (parsedData.otherExpenses || []).map((expense: any) => ({
        description: expense.description || "",
        amount: Number(expense.amount) || 0,
        date: expense.date || "",
        notes: expense.notes || "",
      })),
      advance: Number(parsedData.advance) || 0,
      collectionsForCompany: Number(parsedData.collectionsForCompany) || 0,
      companyTip: Number(parsedData.companyTip) || 0,
    };
    
    // Additional validation for critical fields
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
