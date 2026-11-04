import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Body1, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import ActivityFeed from '../components/ActivityFeed';
import PatientDetail from '../components/PatientDetail';
import { ListSkeleton, LoadError } from '../components/common';
import { matchesQuery, useMonitoring } from '../data/MonitoringContext';
import { useIsMobile } from '../lib/hooks';

const useStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: '380px minmax(0, 1fr)',
    height: '100%',
    '@media (max-width: 1023px)': { gridTemplateColumns: '320px minmax(0, 1fr)' },
    '@media (max-width: 767px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
  feedCol: {
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke2),
  },
  detailCol: {
    minHeight: 0,
    overflowY: 'auto',
    display: 'grid',
    alignContent: 'start',
    ...shorthands.gap('16px'),
    ...shorthands.padding('24px', '32px', '32px'),
    '@media (max-width: 1023px)': { ...shorthands.padding('20px') },
  },
  bar: { ...shorthands.padding('12px', '16px', '0') },
  skeleton: { ...shorthands.padding('16px') },
  placeholder: { color: tokens.colorNeutralForeground3, ...shorthands.padding('8px', '0') },
});

export default function ActivityPage() {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const [params, setParams] = useSearchParams();
  const { status, error, events, eventsById, patientById, refresh, query, setQuery } = useMonitoring();

  const filtered = events.filter((e) => matchesQuery(e.patient, query));
  const fallback = filtered.find((e) => e.unseen) ?? filtered[0];

  const paramPatient = params.get('p');
  const paramTime = params.get('t');
  const patientId = paramPatient ?? fallback?.user_id;
  const patient = patientById[patientId];
  const patientEvents = eventsById[patientId] ?? [];
  const selectedKey = paramTime
    ? `${patientId}|${paramTime}`
    : paramPatient
      ? patientEvents[0]?.key
      : fallback?.key;

  const select = (event) => setParams({ p: event.user_id, t: event.recorded_at }, { replace: true });

  // Kunci pilihan awal ke URL agar tidak melompat saat anomali ditandai sudah dilihat.
  useEffect(() => {
    if (!isMobile && !paramPatient && fallback) {
      setParams({ p: fallback.user_id, t: fallback.recorded_at }, { replace: true });
    }
  }, [isMobile, paramPatient, fallback, setParams]);

  const errorBar = error && (
    <LoadError error={error} onRetry={refresh} stale={status === 'ready'} />
  );

  return (
    <div className={styles.root}>
      <div className={styles.feedCol}>
        {isMobile && errorBar && <div className={styles.bar}>{errorBar}</div>}
        {status === 'loading' ? (
          <div className={styles.skeleton}>
            <ListSkeleton rows={8} />
          </div>
        ) : status === 'error' && !isMobile ? (
          <div className={styles.skeleton}>
            <Body1 className={styles.placeholder}>Umpan aktivitas belum tersedia.</Body1>
          </div>
        ) : (
          status !== 'error' && (
            <ActivityFeed
              events={filtered}
              totalCount={events.length}
              selectedKey={selectedKey}
              onSelect={select}
              query={query}
              onQueryChange={setQuery}
            />
          )
        )}
      </div>

      {!isMobile && (
        <div className={styles.detailCol}>
          {errorBar}
          {status === 'loading' ? (
            <ListSkeleton rows={4} />
          ) : patient ? (
            <PatientDetail
              key={patient.id}
              patient={patient}
              events={patientEvents}
              selectedKey={selectedKey}
              onSelect={select}
              showOpenPage
            />
          ) : (
            status === 'ready' && (
              <Body1 className={styles.placeholder}>
                Pilih aktivitas di sebelah kiri untuk melihat detail pasien.
              </Body1>
            )
          )}
        </div>
      )}
    </div>
  );
}
