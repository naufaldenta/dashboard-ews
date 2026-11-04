import { useSyncExternalStore } from 'react';

// Status "sudah dilihat" hanya disimpan di browser ini; backend tidak menyimpannya.
const STORAGE_KEY = 'telehealth-ews:seen';
const MAX_KEYS = 2000;

const listeners = new Set();
let seen = read();

function read() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []);
  } catch {
    return new Set();
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      seen = read();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function eventKey(log) {
  return `${log.user_id}|${log.recorded_at}`;
}

export function markSeen(keys) {
  if (!keys.length) return;
  seen = new Set([...seen, ...keys]);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen].slice(-MAX_KEYS)));
  } catch {
    // Penyimpanan diblokir; status tetap berlaku selama tab terbuka.
  }
  emit();
}

export function useSeen() {
  return useSyncExternalStore(subscribe, () => seen);
}
