const TZ = 'Asia/Jakarta';

const dateTimeFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: TZ,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const shortDateTimeFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: TZ,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const shortDateFmt = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, day: 'numeric', month: 'short' });
const numberFmt = new Intl.NumberFormat('id-ID');

export function formatDateTime(iso) {
  return iso ? `${dateTimeFmt.format(new Date(iso))} WIB` : '—';
}

export function formatShortDateTime(iso) {
  return iso ? shortDateTimeFmt.format(new Date(iso)) : '—';
}

export function formatAxisTime(ms, spanMs) {
  return spanMs > 36 * 3600 * 1000 ? shortDateFmt.format(ms) : timeFmt.format(ms);
}

// null berarti data belum ada, bukan nol.
export function formatNumber(value) {
  return value == null ? '—' : numberFmt.format(value);
}

export function formatRelative(iso, now = Date.now()) {
  if (!iso) return '—';
  const seconds = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mnt lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)} hari lalu`;
  return shortDateFmt.format(new Date(iso));
}

export function formatAgo(ms, now = Date.now()) {
  if (!ms) return '';
  const seconds = Math.max(0, Math.round((now - ms) / 1000));
  if (seconds < 5) return 'baru saja';
  if (seconds < 60) return `${seconds} dtk lalu`;
  return `${Math.floor(seconds / 60)} mnt lalu`;
}

// Nilai untuk <input type="datetime-local"> dalam jam WIB.
export function nowWibInputValue() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function wibInputToIso(value) {
  return `${value}:00+07:00`;
}
