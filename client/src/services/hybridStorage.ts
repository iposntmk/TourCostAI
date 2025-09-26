import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type DocumentSnapshot,
  type Unsubscribe,
  deleteDoc
} from "firebase/firestore";
import { db, COLLECTIONS, type SyncMetadata } from "../config/firebase";
import type { MasterData } from "../types";

const MASTER_DATA_STORAGE_KEY = "tour-cost-ai/master-data";
const SYNC_METADATA_KEY = "tour-cost-ai/sync-metadata";

export interface StorageResult<T> {
  data: T | null;
  fromCache: boolean;
  error?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: boolean;
  error?: string;
}

class HybridStorageService {
  private isOnline = navigator.onLine;
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();
  private masterDataUnsubscribe: Unsubscribe | null = null;
  private deviceId: string;

  constructor() {
    this.deviceId = this.getDeviceId();
    this.setupOnlineListener();
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem("device-id");
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("device-id", deviceId);
    }
    return deviceId;
  }

  private setupOnlineListener(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifySyncStatus();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifySyncStatus();
    });
  }

  private notifySyncStatus(): void {
    const status: SyncStatus = {
      isOnline: this.isOnline,
      lastSync: this.getLastSyncTime(),
      pendingChanges: this.hasPendingChanges(),
    };
    this.syncListeners.forEach(listener => listener(status));
  }

  // Local Storage Operations
  private saveToLocalStorage(data: MasterData): void {
    try {
      localStorage.setItem(MASTER_DATA_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }

  private loadFromLocalStorage(): MasterData | null {
    try {
      const raw = localStorage.getItem(MASTER_DATA_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as MasterData;
      }
    } catch (error) {
      console.warn("Failed to load from localStorage:", error);
    }
    return null;
  }

  private saveSyncMetadata(metadata: SyncMetadata): void {
    try {
      localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.warn("Failed to save sync metadata:", error);
    }
  }

  private loadSyncMetadata(): SyncMetadata | null {
    try {
      const raw = localStorage.getItem(SYNC_METADATA_KEY);
      if (raw) {
        return JSON.parse(raw) as SyncMetadata;
      }
    } catch (error) {
      console.warn("Failed to load sync metadata:", error);
    }
    return null;
  }

  private getLastSyncTime(): Date | null {
    const metadata = this.loadSyncMetadata();
    return metadata?.lastSync ? new Date(metadata.lastSync) : null;
  }

  private hasPendingChanges(): boolean {
    // Simple implementation - could be enhanced with change tracking
    const localData = this.loadFromLocalStorage();
    const metadata = this.loadSyncMetadata();
    
    if (!localData || !metadata) return false;
    
    // For now, assume there are pending changes if we have local data
    // In a more sophisticated implementation, we'd track changes
    return true;
  }

  // Firestore Operations
  private async saveToFirestore(data: MasterData): Promise<void> {
    if (!this.isOnline) {
      throw new Error("No internet connection");
    }

    const docRef = doc(db, COLLECTIONS.MASTER_DATA, this.deviceId);
    const syncMetadata: SyncMetadata = {
      lastSync: new Date().toISOString(),
      version: Date.now(),
      userId: this.deviceId,
      deviceId: this.deviceId,
    };

    await setDoc(docRef, {
      ...data,
      _metadata: syncMetadata,
      _updatedAt: serverTimestamp(),
    });

    this.saveSyncMetadata(syncMetadata);
  }

  private async loadFromFirestore(): Promise<MasterData | null> {
    if (!this.isOnline) {
      throw new Error("No internet connection");
    }

    const docRef = doc(db, COLLECTIONS.MASTER_DATA, this.deviceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const { _metadata, ...masterData } = data;
      
      if (_metadata) {
        this.saveSyncMetadata(_metadata as SyncMetadata);
      }
      
      return masterData as MasterData;
    }

    return null;
  }

  // Public API
  async loadMasterData(): Promise<StorageResult<MasterData>> {
    // If online, always try to fetch from Firestore first
    if (this.isOnline) {
      try {
        const cloudData = await this.loadFromFirestore();
        if (cloudData) {
          this.saveToLocalStorage(cloudData);
          return {
            data: cloudData,
            fromCache: false,
          };
        }
      } catch (error) {
        console.warn("Failed to load from Firestore:", error);
        // Fallback to local storage if Firestore fails
      }
    }

    // If offline or Firestore fails, try to load from local storage
    const localData = this.loadFromLocalStorage();
    if (localData) {
      return {
        data: localData,
        fromCache: true,
      };
    }

    return {
      data: null,
      fromCache: true,
      error: "No data available",
    };
  }

  async saveMasterData(data: MasterData): Promise<void> {
    // Always save to local storage first (fast)
    this.saveToLocalStorage(data);

    // If online, try to sync to cloud
    if (this.isOnline) {
      try {
        await this.saveToFirestore(data);
        this.notifySyncStatus();
      } catch (error) {
        console.warn("Failed to sync to Firestore:", error);
        // Data is still saved locally, will sync later
      }
    }
  }

  // Real-time sync
  startRealtimeSync(): void {
    if (!this.isOnline) return;

    const docRef = doc(db, COLLECTIONS.MASTER_DATA, this.deviceId);
    
    this.masterDataUnsubscribe = onSnapshot(
      docRef,
      (docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const { _metadata, ...masterData } = data;
          
          // Only update if data is different from local
          const localData = this.loadFromLocalStorage();
          if (!localData || JSON.stringify(localData) !== JSON.stringify(masterData)) {
            this.saveToLocalStorage(masterData as MasterData);
            
            if (_metadata) {
              this.saveSyncMetadata(_metadata as SyncMetadata);
            }
            
            this.notifySyncStatus();
          }
        }
      },
      (error) => {
        console.warn("Realtime sync error:", error);
      }
    );
  }

  stopRealtimeSync(): void {
    if (this.masterDataUnsubscribe) {
      this.masterDataUnsubscribe();
      this.masterDataUnsubscribe = null;
    }
  }

  // Sync status listeners
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  // Force sync
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error("No internet connection");
    }

    const localData = this.loadFromLocalStorage();
    if (localData) {
      await this.saveToFirestore(localData);
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    // Clear local storage
    localStorage.removeItem(MASTER_DATA_STORAGE_KEY);
    localStorage.removeItem(SYNC_METADATA_KEY);
    // localStorage.removeItem("device-id");

    // Clear Firestore data if online
    if (this.isOnline) {
      try {
        const docRef = doc(db, COLLECTIONS.MASTER_DATA, this.deviceId);
        await deleteDoc(docRef); // Overwrite with empty object
      } catch (error) {
        console.warn("Failed to clear Firestore data:", error);
        throw error;
      }
    }
  }
}

// Export singleton instance
export const hybridStorage = new HybridStorageService();