import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";
import type {
  GeneralOverridePreset,
  GeneralOverridePresetInput,
} from "../types";

const collectionRef = collection(db, COLLECTIONS.GENERAL_OVERRIDES);

interface GeneralOverrideDocument extends Omit<GeneralOverridePresetInput, "pax"> {
  pax?: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const toIsoString = (value: Timestamp | undefined): string => {
  if (!value) {
    return new Date().toISOString();
  }
  const date = value.toDate();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const parseGeneralOverride = (
  snapshot: QueryDocumentSnapshot,
): GeneralOverridePreset => {
  const data = snapshot.data() as Partial<GeneralOverrideDocument>;

  return {
    id: snapshot.id,
    name: data.name ?? "Gợi ý mới",
    tourCode: data.tourCode ?? "",
    customerName: data.customerName ?? "",
    clientCompany: data.clientCompany ?? "",
    pax: typeof data.pax === "number" ? data.pax : null,
    nationality: data.nationality ?? "",
    startDate: data.startDate ?? "",
    endDate: data.endDate ?? "",
    guideName: data.guideName ?? "",
    driverName: data.driverName ?? "",
    notes: data.notes ?? "",
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
};

const cleanupPayload = (
  updates: Partial<GeneralOverridePresetInput>,
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    if (key === "pax") {
      payload[key] = value === null || value === "" ? null : value;
      return;
    }
    if (typeof value === "string") {
      payload[key] = value;
      return;
    }
    payload[key] = value;
  });

  return payload;
};

export const subscribeToGeneralOverrides = (
  onChange: (presets: GeneralOverridePreset[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe => {
  const q = query(collectionRef, orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map(parseGeneralOverride);
      onChange(items);
    },
    (error) => {
      console.warn("Failed to subscribe to general overrides", error);
      onError?.(error);
    },
  );
};

export const createGeneralOverride = async (
  initial?: Partial<GeneralOverridePresetInput>,
): Promise<string> => {
  const now = serverTimestamp();
  const payload: Record<string, unknown> = {
    name: initial?.name?.trim() || "Gợi ý mới",
    tourCode: initial?.tourCode?.trim() ?? "",
    customerName: initial?.customerName?.trim() ?? "",
    clientCompany: initial?.clientCompany?.trim() ?? "",
    pax: initial?.pax ?? null,
    nationality: initial?.nationality?.trim() ?? "",
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
    guideName: initial?.guideName?.trim() ?? "",
    driverName: initial?.driverName?.trim() ?? "",
    notes: initial?.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collectionRef, payload);
  return docRef.id;
};

export const updateGeneralOverride = async (
  id: string,
  updates: Partial<GeneralOverridePresetInput>,
): Promise<void> => {
  const docRef = doc(collectionRef, id);
  const payload = cleanupPayload(updates);
  payload.updatedAt = serverTimestamp();
  await setDoc(docRef, payload, { merge: true });
};

export const deleteGeneralOverride = async (id: string): Promise<void> => {
  const docRef = doc(collectionRef, id);
  await deleteDoc(docRef);
};
