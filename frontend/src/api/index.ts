import type { DocType, TimelineResponse, TrendsResponse, AlertsResponse, UploadResponse, ApiError, Record as RecordType, UploadProgress } from '../types';

export type { UploadProgress };

const MOCK_CONTRACT_BASE = '/contract';

let useMock = import.meta.env.VITE_USE_MOCK === 'true';

try {
  const stored = localStorage.getItem('health-copilot-use-mock');
  if (stored !== null) {
    useMock = stored === 'true';
  }
} catch {
  // localStorage not available
}

function persistMockMode() {
  try {
    localStorage.setItem('health-copilot-use-mock', String(useMock));
  } catch {
    // ignore
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadMockJson<T>(filename: string): Promise<T> {
  const res = await fetch(`${MOCK_CONTRACT_BASE}/${filename}`);
  if (!res.ok) {
    throw { error: { code: 'MOCK_LOAD_FAILED', message: `Failed to load ${filename}` } } as ApiError;
  }
  return res.json() as Promise<T>;
}

const mockRecordMap: Record<string, RecordType> = {};

async function getMockRecord(docType: DocType): Promise<RecordType> {
  const filename = `mock_${docType}.json`.replace('lab_report', 'lab').replace('discharge_summary', 'discharge');
  const record = await loadMockJson<RecordType>(filename);
  mockRecordMap[record.record_id] = record;
  return record;
}

function generateRecordId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getApiBase(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const err = (await res.json()) as ApiError;
      message = err.error?.message || message;
    } catch {
      message = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw { error: { code: `HTTP_${res.status}`, message } } as ApiError;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  setUseMock(value: boolean) {
    useMock = value;
    persistMockMode();
  },

  getUseMock(): boolean {
    return useMock;
  },

  async uploadRecord(file: File, onProgress?: (progress: UploadProgress) => void): Promise<UploadResponse> {
    if (useMock) {
      const steps: UploadProgress[] = [
        { step: 'reading', message: 'Reading your document…' },
        { step: 'extracting', message: 'Extracting medical data…' },
        { step: 'checking', message: 'Checking reference ranges…' },
        { step: 'complete', message: 'Analysis complete!' },
      ];

      for (const step of steps) {
        onProgress?.(step);
        await delay(400);
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      let docType: DocType = 'lab_report';
      if (ext === 'pdf') docType = 'prescription';
      else if (file.name.toLowerCase().includes('discharge')) docType = 'discharge_summary';

      const record = await getMockRecord(docType);
      const newRecordId = generateRecordId();
      const newRecord: RecordType = { ...record, record_id: newRecordId };
      mockRecordMap[newRecordId] = newRecord;

      return {
        record_id: newRecordId,
        status: 'draft',
        record: newRecord,
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${getApiBase()}/profiles/default/records`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      let message = 'Upload failed';
      try {
        const err = (await res.json()) as ApiError;
        message = err.error?.message || message;
      } catch {
        message = `HTTP ${res.status}: ${res.statusText}`;
      }
      throw { error: { code: `HTTP_${res.status}`, message } } as ApiError;
    }

    return res.json() as Promise<UploadResponse>;
  },

  async getRecord(id: string): Promise<{ record_id: string; status: 'draft' | 'confirmed'; record: RecordType }> {
    if (useMock) {
      if (mockRecordMap[id]) {
        return { record_id: id, status: 'draft', record: mockRecordMap[id] };
      }
      const ext = id.split('-')[1] || 'lab';
      const docType: DocType = ext === 'rx' ? 'prescription' : ext === 'discharge' ? 'discharge_summary' : 'lab_report';
      const record = await getMockRecord(docType);
      return { record_id: id, status: 'draft', record };
    }

    return request(`/records/${id}`);
  },

  async getRecordFile(id: string): Promise<Blob> {
    if (useMock) {
      return new Blob(['mock'], { type: 'application/pdf' });
    }
    const res = await fetch(`${getApiBase()}/records/${id}/file`, { credentials: 'include' });
    if (!res.ok) throw { error: { code: `HTTP_${res.status}`, message: 'Failed to load document' } } as ApiError;
    return res.blob();
  },

  async confirmRecord(id: string, record: RecordType): Promise<{ record_id: string; status: 'confirmed'; record: RecordType }> {
    if (useMock) {
      mockRecordMap[id] = record;
      return { record_id: id, status: 'confirmed', record };
    }
    return request(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ record }),
    });
  },

  async getTimeline(profileId: string = 'default'): Promise<TimelineResponse> {
    if (useMock) {
      const allRecords = Object.values(mockRecordMap);
      const items = allRecords.map((r) => ({
        record_id: r.record_id,
        doc_type: r.doc_type,
        doc_date: r.doc_date || new Date().toISOString().split('T')[0],
        status: 'confirmed' as const,
        headline: r.tests.length > 0 ? `${r.tests.length} test(s)` : `${r.medicines.length} medicine(s)`,
        medicines: r.medicines,
        tests: r.tests,
      }));
      return { items: items.sort((a, b) => b.doc_date.localeCompare(a.doc_date)) };
    }
    return request(`/profiles/${profileId}/timeline`);
  },

  async getTrends(profileId: string, test: string): Promise<TrendsResponse> {
    if (useMock) {
      const points: Array<{ date: string; value: number; flag: 'HIGH' | 'NORMAL'; record_id: string }> = [
        { date: '2024-10-15', value: 7.8, flag: 'HIGH', record_id: 'mock-1' },
        { date: '2024-11-15', value: 7.5, flag: 'HIGH', record_id: 'mock-2' },
        { date: '2024-12-15', value: 7.2, flag: 'HIGH', record_id: 'mock-lab-001' },
      ];
      return { test, unit: '%', points };
    }
    return request(`/profiles/${profileId}/trends?test=${encodeURIComponent(test)}`);
  },

  async getAlerts(profileId: string = 'default'): Promise<AlertsResponse> {
    if (useMock) {
      return {
        alerts: [
          {
            type: 'duplicate_generic',
            generic: 'Paracetamol',
            medicines: [
              { name_raw: 'Dolo 650', generic: 'Paracetamol', strength: '650 mg', schedule_raw: '1-0-1', schedule_parsed: ['morning', 'night'], food_instruction: 'after_food', duration_days: 5, confidence: 0.87, bbox: null },
              { name_raw: 'Crocin 500', generic: 'Paracetamol', strength: '500 mg', schedule_raw: '1-0-1', schedule_parsed: ['morning', 'night'], food_instruction: 'after_food', duration_days: 3, confidence: 0.82, bbox: null },
            ],
            record_ids: ['mock-rx-001', 'mock-rx-002'],
            message: 'Same generic found in multiple prescriptions. Ask your doctor or pharmacist.',
          },
        ],
      };
    }
    return request(`/profiles/${profileId}/alerts`);
  },

  async linkAbha(profileId: string, abhaId: string): Promise<{ mock: true; status: 'linked' }> {
    if (useMock) {
      await delay(500);
      return { mock: true, status: 'linked' };
    }
    return request(`/profiles/${profileId}/abha/link`, { method: 'POST', body: JSON.stringify({ abha_id: abhaId }) });
  },

  async importAbha(profileId: string): Promise<{ mock: true; imported_record_ids: string[] }> {
    if (useMock) {
      await delay(800);
      return { mock: true, imported_record_ids: ['mock-imported-1', 'mock-imported-2'] };
    }
    return request(`/profiles/${profileId}/abha/import`, { method: 'POST' });
  },

  async deleteProfile(profileId: string): Promise<{ deleted: true }> {
    if (useMock) {
      await delay(300);
      Object.keys(mockRecordMap).forEach((k) => delete mockRecordMap[k]);
      return { deleted: true };
    }
    return request(`/profiles/${profileId}`, { method: 'DELETE' });
  },

  async askRecords(profileId: string, question: string): Promise<{ answer: string; sources: Array<{ record_id: string; field: string }>; grounded: boolean }> {
    if (useMock) {
      await delay(1000);
      return {
        answer: 'This is a mock response. In production, this would answer based on your uploaded records.',
        sources: [],
        grounded: true,
      };
    }
    return request(`/profiles/${profileId}/ask`, { method: 'POST', body: JSON.stringify({ question }) });
  },

  async healthCheck(): Promise<{ status: 'ok' }> {
    if (useMock) return { status: 'ok' };
    return request('/health');
  },
};

export default api;