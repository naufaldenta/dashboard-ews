export const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://telehealth-ai-backend.vercel.app'
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { timeout = 20000, ...options } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, signal: controller.signal });
  } catch (err) {
    throw new ApiError(
      err.name === 'AbortError'
        ? 'Backend tidak merespons tepat waktu.'
        : 'Tidak dapat terhubung ke backend. Periksa koneksi internet.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Response bukan JSON; pesan error memakai kode HTTP saja.
  }

  if (!response.ok || body?.success === false) {
    throw new ApiError(body?.message || body?.error || `HTTP ${response.status}`, response.status);
  }
  return body;
}

export async function getPatients() {
  const body = await request('/api/patients');
  return body.patients ?? [];
}

export function getPatientDetail(id) {
  return request(`/api/patients/${encodeURIComponent(id)}`);
}

// Gemini dicoba sampai 3x dengan timeout 20 detik, jadi beri batas waktu longgar.
export function analyze(payload) {
  return request('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeout: 90000,
  });
}
