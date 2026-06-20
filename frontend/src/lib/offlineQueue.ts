import { apiFetch } from './api';

export interface OfflineAction {
  id?: number;
  type: 'log' | 'challenge';
  userId: string;
  data: any;
  timestamp: number;
}

const DB_NAME = 'terra-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'offline-actions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export async function enqueueAction(type: 'log' | 'challenge', userId: string, data: any): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const action: OfflineAction = {
      type,
      userId,
      data,
      timestamp: Date.now()
    };
    const request = store.add(action);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getQueuedActions(userId: string): Promise<OfflineAction[]> {
  const db = await openDB();
  return new Promise<OfflineAction[]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const allActions = request.result as OfflineAction[];
      // Filter by userId to ensure sandbox security per-user
      resolve(allActions.filter(a => a.userId === userId));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAction(id: number): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function syncOfflineQueue(userId: string): Promise<void> {
  const actions = await getQueuedActions(userId);
  if (actions.length === 0) return;

  // Sort by timestamp to ensure chronological order of actions
  actions.sort((a, b) => a.timestamp - b.timestamp);

  for (const action of actions) {
    try {
      if (action.type === 'log') {
        const response = await apiFetch("/log", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: action.data.category,
            subtype: action.data.subtype,
            amount: action.data.amount,
            description: action.data.description,
            fuel_type: action.data.fuel_type,
            region: action.data.region
          })
        });
        if (!response.ok) {
          throw new Error("Failed to sync log action");
        }
      } else if (action.type === 'challenge') {
        const response = await apiFetch("/actions/complete", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challenge_id: action.data.challengeId })
        });
        if (!response.ok) {
          throw new Error("Failed to sync challenge action");
        }
      }

      // If successfully synced, delete from queue
      if (action.id !== undefined) {
        await deleteAction(action.id);
      }
    } catch (e) {
      console.error(`Failed to sync offline action ${action.id}:`, e);
      // Stop syncing subsequent items to maintain chronological database consistency
      break;
    }
  }
}
