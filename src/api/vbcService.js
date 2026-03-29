// Lightweight VBC API helper - minimal wrapper around fetch for VBC endpoints.
import { BACKEND_URL } from "../constants";

const BASE = (BACKEND_URL || "").replace(/\/+$/, "");
const api = (path) => `${BASE}/${String(path).replace(/^\/+/, "")}`;

const handleResponse = async (res) => {
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    const err = text || res.statusText || 'API error';
    throw new Error(err);
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }

  return text;
};

const DEV_MOCK = {
  checklist: {
    items: [
      { id: 'c1', title: 'Vaccination status', status: 'unknown' },
      { id: 'c2', title: 'Medication review', status: 'pending' },
    ],
  },
  summary: { text: 'Mock VBC summary' },
  cycle: { id: 'mock-cycle-1', status: 'started' },
  workqueue: { tasks: [] },
};

const safeFetch = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    // If running in dev, return a mock to avoid blocking front-end work.
    if (process && process.env && process.env.NODE_ENV === 'development') {
      console.warn('vbcService fetch failed, returning mock in dev:', e);
      return DEV_MOCK;
    }
    throw e;
  }
};

export async function fetchChecklist(appointmentId) {
  return safeFetch(async () => {
    const url = api(`/api/vbc/checklist?appointmentId=${encodeURIComponent(appointmentId)}`);
    const res = await fetch(url, { credentials: 'include' });
    return handleResponse(res);
  });
}

export async function submitChecklist(appointmentId, payload = {}) {
  return safeFetch(async () => {
    const url = api(`/api/vbc/checklist`);
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, data: payload }),
    });
    return handleResponse(res);
  });
}

export async function fetchSummary(appointmentId) {
  return safeFetch(async () => {
    const url = api(`/api/vbc/summary?appointmentId=${encodeURIComponent(appointmentId)}`);
    const res = await fetch(url, { credentials: 'include' });
    return handleResponse(res);
  });
}

export async function startCycle(appointmentId) {
  return safeFetch(async () => {
    const url = api(`/api/vbc/cycle/start`);
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId }),
    });
    return handleResponse(res);
  });
}

export async function getWorkQueue(params = {}) {
  return safeFetch(async () => {
    const qs = new URLSearchParams(params).toString();
    const url = api(`/api/vbc/workqueue${qs ? `?${qs}` : ''}`);
    const res = await fetch(url, { credentials: 'include' });
    return handleResponse(res);
  });
}

const vbcServiceDefault = {
  fetchChecklist,
  submitChecklist,
  fetchSummary,
  startCycle,
  getWorkQueue,
};

export default vbcServiceDefault;
