import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Prompt } from "../types/prompt";

const PROMPTS_COLLECTION = "prompts";

/**
 * Get all prompts from Firebase
 */
export async function getAllPrompts(): Promise<Prompt[]> {
  try {
    const promptsRef = collection(db, PROMPTS_COLLECTION);
    const q = query(promptsRef, orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Prompt));
  } catch (error) {
    console.error("Error getting prompts:", error);
    throw new Error("Không thể tải danh sách prompts");
  }
}

/**
 * Get the latest active prompt
 */
export async function getLatestPrompt(): Promise<Prompt | null> {
  try {
    const promptsRef = collection(db, PROMPTS_COLLECTION);
    const q = query(promptsRef, orderBy("updatedAt", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Prompt;
  } catch (error) {
    console.error("Error getting latest prompt:", error);
    throw new Error("Không thể tải prompt mới nhất");
  }
}

/**
 * Save a new prompt (replaces all existing prompts)
 */
export async function savePrompt(promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    // First, delete all existing prompts
    await deleteAllPrompts();
    
    // Then save the new prompt
    const promptsRef = collection(db, PROMPTS_COLLECTION);
    const newPromptRef = doc(promptsRef);
    
    const now = Timestamp.now();
    const promptToSave: Omit<Prompt, "id"> = {
      ...promptData,
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(newPromptRef, promptToSave);
    
    return newPromptRef.id;
  } catch (error) {
    console.error("Error saving prompt:", error);
    throw new Error("Không thể lưu prompt");
  }
}

/**
 * Update an existing prompt
 */
export async function updatePrompt(promptId: string, promptData: Partial<Omit<Prompt, "id" | "createdAt">>): Promise<void> {
  try {
    const promptRef = doc(db, PROMPTS_COLLECTION, promptId);
    
    const updateData = {
      ...promptData,
      updatedAt: Timestamp.now()
    };
    
    await setDoc(promptRef, updateData, { merge: true });
  } catch (error) {
    console.error("Error updating prompt:", error);
    throw new Error("Không thể cập nhật prompt");
  }
}

/**
 * Delete a specific prompt
 */
export async function deletePrompt(promptId: string): Promise<void> {
  try {
    const promptRef = doc(db, PROMPTS_COLLECTION, promptId);
    await deleteDoc(promptRef);
  } catch (error) {
    console.error("Error deleting prompt:", error);
    throw new Error("Không thể xóa prompt");
  }
}

/**
 * Delete all prompts
 */
export async function deleteAllPrompts(): Promise<void> {
  try {
    const prompts = await getAllPrompts();
    const deletePromises = prompts.map(prompt => deletePrompt(prompt.id));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting all prompts:", error);
    throw new Error("Không thể xóa tất cả prompts");
  }
}

/**
 * Create default prompt if none exists
 */
export async function createDefaultPrompt(): Promise<string> {
  const defaultPrompt: Omit<Prompt, "id" | "createdAt" | "updatedAt"> = {
    name: "Prompt mặc định",
    content: `Bạn là một chuyên gia phân tích chương trình tour du lịch. Hãy phân tích hình ảnh này và trích xuất thông tin tour một cách chính xác.

QUAN TRỌNG: 
- Hình ảnh là chương trình tour chứa đầy đủ thông tin tour
- Tất cả text có thể là tiếng Việt có dấu (ă, â, ê, ô, ơ, ư, đ)
- CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT THÊM

THÔNG TIN CẦN TRÍCH XUẤT:
1. Mã tour (tour code)
2. Tên công ty cung cấp tour cho khách
3. Tên hướng dẫn viên (guide name)
4. Số lượng khách (PAX)
5. Quốc tịch khách
6. Ngày bắt đầu và kết thúc tour
7. Các điểm tham quan
8. Các dịch vụ dùng trong tour
9. Ăn trưa, ăn tối
10. Chi phí và giá tiền

Yêu cầu trả về dữ liệu theo định dạng JSON chính xác như sau:

{
  "general": {
    "tourCode": "mã tour (vd: SGN-DAD-2406)",
    "customerName": "tên khách hàng",
    "clientCompany": "tên công ty cung cấp tour cho khách",
    "nationality": "quốc tịch khách",
    "pax": số_khách,
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD", 
    "guideName": "tên hướng dẫn viên",
    "driverName": "tên tài xế",
    "notes": "ghi chú vận hành"
  },
  "services": [
    {
      "rawName": "tên dịch vụ (vd: Vé tham quan, Xe đưa đón, Khách sạn, Ăn trưa, Ăn tối)",
      "quantity": số_lượng,
      "price": giá_tiền,
      "notes": "ghi chú"
    }
  ],
  "itinerary": [
    {
      "day": số_ngày,
      "date": "YYYY-MM-DD",
      "location": "địa điểm tham quan",
      "activities": ["hoạt động 1", "hoạt động 2", "ăn trưa", "ăn tối"]
    }
  ],
  "otherExpenses": [
    {
      "description": "mô tả chi phí khác",
      "amount": số_tiền,
      "date": "YYYY-MM-DD",
      "notes": "ghi chú"
    }
  ],
  "advance": số_tiền_tạm_ứng,
  "collectionsForCompany": số_tiền_thu_hộ,
  "companyTip": số_tiền_tip_công_ty
}

HƯỚNG DẪN PHÂN TÍCH CHƯƠNG TRÌNH TOUR:
1. Đọc tất cả text trong hình ảnh, bao gồm tiếng Việt có dấu
2. Tìm mã tour (thường ở đầu trang hoặc tiêu đề)
3. Tìm tên công ty cung cấp tour cho khách
4. Tìm tên hướng dẫn viên (guide)
5. Tìm số lượng khách (PAX/pax)
6. Tìm quốc tịch khách
7. Tìm ngày bắt đầu và kết thúc tour
8. Tìm các điểm tham quan trong lịch trình
9. Tìm các dịch vụ: vé tham quan, xe đưa đón, khách sạn, ăn trưa, ăn tối
10. Tìm giá tiền cho từng dịch vụ
11. Tìm các chi phí khác như tạm ứng, tip, thu hộ
12. Nếu không tìm thấy thông tin nào, để mảng rỗng []

Lưu ý quan trọng:
1. CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CÓ TEXT THÊM
2. Nếu không tìm thấy thông tin nào, để giá trị null hoặc ""
3. Ngày tháng phải đúng định dạng YYYY-MM-DD
4. Giá tiền phải là số nguyên (không có dấu phẩy)
5. Phân tích kỹ hình ảnh để trích xuất đầy đủ thông tin
6. Đọc được tiếng Việt có dấu: ă, â, ê, ô, ơ, ư, đ
7. Có thể đọc bảng CSV, Excel, PDF
8. Chú ý các từ khóa: tour code, guide, pax, nationality, start date, end date, attractions, services, lunch, dinner`,
    description: "Prompt mặc định cho việc trích xuất dữ liệu tour từ hình ảnh",
    isActive: true
  };

  return await savePrompt(defaultPrompt);
}