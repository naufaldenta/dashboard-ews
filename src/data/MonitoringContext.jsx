import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getPatientDetail, getPatients } from '../lib/api';
import { eventKey, useSeen } from '../lib/seen';

const REFRESH_MS = 30000;

const MonitoringContext = createContext(null);

export function MonitoringProvider({ children }) {
  const [state, setState] = useState({
    status: 'loading',
    patients: [],
    logsById: {},
    error: null,
    updatedAt: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const inFlight = useRef(false);
  const seen = useSeen();

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      const patients = await getPatients();
      // /api/patients hanya memberi pengukuran terbaru, jadi riwayat diambil per pasien.
      const withData = patients.filter((p) => p.recorded_at);
      const details = await Promise.allSettled(withData.map((p) => getPatientDetail(p.id)));
      setState((prev) => {
        const logsById = {};
        details.forEach((result, i) => {
          const id = withData[i].id;
          if (result.status === 'fulfilled') logsById[id] = result.value.health_logs ?? [];
          else if (prev.logsById[id]) logsById[id] = prev.logsById[id];
        });
        return { status: 'ready', patients, logsById, error: null, updatedAt: Date.now() };
      });
    } catch (error) {
      setState((prev) => ({ ...prev, status: prev.updatedAt ? 'ready' : 'error', error }));
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, REFRESH_MS);
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const value = useMemo(() => {
    const patientById = Object.fromEntries(state.patients.map((p) => [p.id, p]));

    const events = [];
    for (const [id, logs] of Object.entries(state.logsById)) {
      const patient = patientById[id];
      if (!patient) continue;
      // health_logs tidak punya id; dua pengukuran bisa memiliki waktu yang sama persis.
      const counts = {};
      for (const log of logs) {
        const base = eventKey(log);
        counts[base] = (counts[base] ?? 0) + 1;
        const key = counts[base] > 1 ? `${base}#${counts[base]}` : base;
        events.push({
          ...log,
          key,
          patient,
          time: new Date(log.recorded_at).getTime(),
          status: log.is_anomaly ? 'ANOMALI' : 'NORMAL',
          unseen: Boolean(log.is_anomaly) && !seen.has(key),
        });
      }
    }
    events.sort((a, b) => b.time - a.time);

    const eventsById = {};
    for (const event of events) (eventsById[event.user_id] ??= []).push(event);

    return {
      ...state,
      patientById,
      events,
      eventsById,
      unseenCount: events.filter((e) => e.unseen).length,
      refreshing,
      refresh: load,
      query,
      setQuery,
    };
  }, [state, seen, refreshing, load, query]);

  return <MonitoringContext.Provider value={value}>{children}</MonitoringContext.Provider>;
}

export function useMonitoring() {
  return useContext(MonitoringContext);
}

export function matchesQuery(patient, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    patient.full_name?.toLowerCase().includes(q) || patient.email?.toLowerCase().includes(q)
  );
}
