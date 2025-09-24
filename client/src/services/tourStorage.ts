import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db, COLLECTIONS } from "../config/firebase";
import type { Tour } from "../types";

const sanitizeTourCode = (code: string): string =>
  code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/gi, "-");

export const fetchTours = async (): Promise<Tour[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.TOURS));
  return snapshot.docs.map((docItem) => docItem.data() as Tour);
};

export const subscribeToTours = (
  listener: (tours: Tour[]) => void,
): Unsubscribe =>
  onSnapshot(collection(db, COLLECTIONS.TOURS), (snapshot) => {
    const tours = snapshot.docs.map((docItem) => docItem.data() as Tour);
    listener(tours);
  });

export const saveTourDocument = async (tour: Tour): Promise<void> => {
  const codeKey = sanitizeTourCode(tour.general.code);
  await setDoc(doc(db, COLLECTIONS.TOURS, codeKey), tour);
};

export const deleteTourDocument = async (tourCode: string): Promise<void> => {
  const codeKey = sanitizeTourCode(tourCode);
  await deleteDoc(doc(db, COLLECTIONS.TOURS, codeKey));
};
