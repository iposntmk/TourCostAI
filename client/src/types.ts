export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  partnerId?: string;
  description?: string;
}

export interface Guide {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  languages?: string[];
}

export interface Partner {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface PerDiemRate {
  id: string;
  location: string;
  rate: number;
  currency: string;
  notes?: string;
}

export interface Catalogs {
  nationalities: string[];
  serviceTypes: string[];
}

export interface MasterData {
  services: Service[];
  guides: Guide[];
  partners: Partner[];
  perDiemRates: PerDiemRate[];
  catalogs: Catalogs;
}

export interface ItineraryItem {
  id: string;
  day: number;
  date: string;
  location: string;
  activities: string[];
}

export interface TourService {
  id: string;
  serviceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  sourcePrice?: number;
  discrepancy?: number;
  notes?: string;
}

export interface PerDiemEntry {
  id: string;
  guideId: string;
  location: string;
  days: number;
  rate: number;
  total: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface FinancialSummary {
  advance: number;
  collectionsForCompany: number;
  companyTip: number;
  totalCost: number;
  differenceToAdvance: number;
}

export interface TourGeneralInfo {
  code: string;
  customerName: string;
  clientCompany?: string;
  nationality: string;
  pax: number;
  startDate: string;
  endDate: string;
  guideId: string;
  driverName: string;
  notes?: string;
}

export interface Tour {
  id: string;
  general: TourGeneralInfo;
  itinerary: ItineraryItem[];
  services: TourService[];
  perDiem: PerDiemEntry[];
  otherExpenses: Expense[];
  financials: FinancialSummary;
  createdAt: string;
  updatedAt: string;
}

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
}

export interface ExtractionServiceCandidate {
  rawName: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface ExtractionItineraryItem {
  day: number;
  date: string;
  location: string;
  activities: string[];
}

export interface ExtractionExpense {
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface ExtractionResult {
  general: ExtractionGeneralInfo;
  services: ExtractionServiceCandidate[];
  itinerary: ExtractionItineraryItem[];
  otherExpenses: ExtractionExpense[];
  advance?: number;
  collectionsForCompany?: number;
  companyTip?: number;
}

export interface MatchedService {
  candidate: ExtractionServiceCandidate;
  service?: Service;
  normalizedPrice: number;
  discrepancy: number;
}

export type TabKey =
  | "general"
  | "perDiem"
  | "itinerary"
  | "costs"
  | "otherExpenses"
  | "summary";
