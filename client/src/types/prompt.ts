import { Timestamp } from "firebase/firestore";

export interface Prompt {
  id: string;
  name: string;
  content: string;
  description: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}