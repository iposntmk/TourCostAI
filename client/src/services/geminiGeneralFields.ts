import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, setDoc, serverTimestamp, type QueryDocumentSnapshot, type Unsubscribe } from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";

export type GeminiGeneralFieldType = "text" | "number" | "date" | "select";

export interface GeminiGeneralField {
  id: string;
  key: string;
  label: string;
  description: string;
  type: GeminiGeneralFieldType;
  options?: string[];
  optional?: boolean;
  isCustom?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeminiGeneralFieldInput {
  key: string;
  label: string;
  description: string;
  type: GeminiGeneralFieldType;
  options?: string[];
  optional?: boolean;
  isCustom?: boolean;
}

const collectionRef = collection(db, COLLECTIONS.GEMINI_GENERAL_FIELDS);

const toIsoString = (value: unknown): string => {
  if (typeof value === "object" && value && "toDate" in value && typeof (value as any).toDate === "function") {
    const date = (value as any).toDate();
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }
  return new Date().toISOString();
};

const parseField = (snapshot: QueryDocumentSnapshot): GeminiGeneralField => {
  const data = snapshot.data() as Partial<GeminiGeneralField> & { createdAt?: any; updatedAt?: any };
  return {
    id: snapshot.id,
    key: data.key ?? "",
    label: data.label ?? "",
    description: data.description ?? "",
    type: (data.type as GeminiGeneralFieldType) ?? "text",
    options: Array.isArray(data.options) ? data.options : [],
    optional: Boolean(data.optional),
    isCustom: Boolean(data.isCustom),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
};

export const subscribeToFields = (
  onChange: (fields: GeminiGeneralField[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe => {
  const q = query(collectionRef, orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map(parseField)),
    (error) => onError?.(error)
  );
};

export const listFields = async (): Promise<GeminiGeneralField[]> => {
  const snapshot = await getDocs(query(collectionRef, orderBy("updatedAt", "desc")));
  return snapshot.docs.map(parseField);
};

function scrubUndefined<T extends object>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
    if (v === undefined) return; // Firestore disallows undefined
    out[k] = v;
  });
  return out;
}

function buildCreatePayload(input: Partial<GeminiGeneralFieldInput>) {
  const base = scrubUndefined(input);
  // Only keep options for select and if it's a real array
  if (base.type !== "select") {
    delete (base as any).options;
  } else if (!Array.isArray((base as any).options)) {
    delete (base as any).options;
  }
  return base;
}

export const createField = async (input: GeminiGeneralFieldInput): Promise<string> => {
  const now = serverTimestamp();
  const id = (input.key || "").toString();
  if (!id) throw new Error("Invalid key for field document id");
  const clean = buildCreatePayload(input);
  const payload = { ...clean, createdAt: now, updatedAt: now } as any;
  await setDoc(doc(collectionRef, id), payload, { merge: true });
  return id;
};

export const updateField = async (id: string, updates: Partial<GeminiGeneralFieldInput>): Promise<void> => {
  const clean = buildCreatePayload(updates);
  const payload: Record<string, unknown> = { ...clean, updatedAt: serverTimestamp() };
  await setDoc(doc(collectionRef, id), payload, { merge: true });
};

export const deleteField = async (id: string): Promise<void> => {
  await deleteDoc(doc(collectionRef, id));
};
