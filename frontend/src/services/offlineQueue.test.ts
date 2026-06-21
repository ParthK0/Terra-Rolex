import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enqueueAction, getQueuedActions, deleteAction, syncOfflineQueue } from './offlineQueue';
import { apiFetch } from './api';

// Mock apiFetch
vi.mock('./api', () => ({
  apiFetch: vi.fn()
}));

describe('Offline Queue Utility', () => {
  let mockStore: any[] = [];

  beforeEach(() => {
    mockStore = [];
    vi.restoreAllMocks();
    
    // Mock the global indexedDB
    const mockDB = {
      transaction: () => ({
        objectStore: () => ({
          add: (action: Record<string, unknown>) => {
            mockStore.push(action);
            const req = { onsuccess: null, onerror: null } as any;
            setTimeout(() => req.onsuccess?.(), 0);
            return req;
          },
          getAll: () => {
            const req = { onsuccess: null, onerror: null, result: mockStore } as any;
            setTimeout(() => req.onsuccess?.(), 0);
            return req;
          },
          delete: (id: number) => {
            mockStore = mockStore.filter(a => a.id !== id);
            const req = { onsuccess: null, onerror: null } as any;
            setTimeout(() => req.onsuccess?.(), 0);
            return req;
          }
        })
      })
    };

    const mockOpenRequest = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB
    } as any;

    global.indexedDB = {
      open: () => {
        setTimeout(() => mockOpenRequest.onsuccess?.(), 0);
        return mockOpenRequest;
      }
    } as any;
  });

  it('enqueues actions correctly', async () => {
    await enqueueAction('log', 'user123', { category: 'transport', amount: 10 });
    expect(mockStore.length).toBe(1);
    expect(mockStore[0].type).toBe('log');
    expect(mockStore[0].userId).toBe('user123');
    expect(mockStore[0].data.category).toBe('transport');
  });

  it('filters actions by userId', async () => {
    await enqueueAction('log', 'user123', { category: 'transport' });
    await enqueueAction('challenge', 'user456', { challengeId: 'ch1' });
    
    const user123Actions = await getQueuedActions('user123');
    expect(user123Actions.length).toBe(1);
    expect(user123Actions[0].type).toBe('log');
    
    const user456Actions = await getQueuedActions('user456');
    expect(user456Actions.length).toBe(1);
    expect(user456Actions[0].type).toBe('challenge');
  });

  it('deletes actions correctly', async () => {
    mockStore = [
      { id: 1, type: 'log', userId: 'user123', data: {} },
      { id: 2, type: 'challenge', userId: 'user123', data: {} }
    ];

    await deleteAction(1);
    expect(mockStore.length).toBe(1);
    expect(mockStore[0].id).toBe(2);
  });

  it('syncs offline actions successfully', async () => {
    mockStore = [
      { id: 1, type: 'log', userId: 'user123', data: { category: 'transport', subtype: 'car', amount: 5 }, timestamp: 100 },
      { id: 2, type: 'challenge', userId: 'user123', data: { challengeId: 'eco-action-1' }, timestamp: 200 }
    ];

    vi.mocked(apiFetch).mockResolvedValue({
      ok: true
    } as any);

    await syncOfflineQueue('user123');

    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(apiFetch).toHaveBeenNthCalledWith(1, '/log', expect.objectContaining({ method: 'POST' }));
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/actions/complete', expect.objectContaining({ method: 'POST' }));
    expect(mockStore.length).toBe(0); // Both synced and deleted from queue
  });
});
