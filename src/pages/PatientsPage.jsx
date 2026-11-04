import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Body1,
  Caption1,
  SearchBox,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title2,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { ListSkeleton, LoadError, StatusBadge } from '../components/common';
import { matchesQuery, useMonitoring } from '../data/MonitoringContext';
import { formatNumber, formatRelative, formatShortDateTime } from '../lib/format';
import { useIsMobile, useNow } from '../lib/hooks';

const SEVERITY = { ANOMALI: 0, NORMAL: 1, 'BELUM ADA DATA': 2 };

const COLUMNS = [
  { id: 'status', label: 'Status', value: (p) => SEVERITY[p.status] ?? 3 },
  { id: 'name', label: 'Pasien', value: (p) => p.full_name?.toLowerCase() ?? '' },
  { id: 'heart_rate', label: 'Detak jantung', value: (p) => p.heart_rate },
  { id: 'steps', label: 'Langkah', value: (p) => p.steps },
  { id: 'risk_score', label: 'Skor', value: (p) => p.risk_score },
  { id: 'recorded_at', label: 'Diukur (WIB)', value: (p) => (p.recorded_at ? Date.parse(p.recorded_at) : null) },
];

function compare(a, b, column, direction) {
  const va = column.value(a);
  const vb = column.value(b);
  // Data kosong selalu di bawah, apa pun arah urutannya.
  if (va == null && vb == null) return 0;
  if (va == null) return 1;
  if (vb == null) return -1;
  const result = va < vb ? -1 : va > vb ? 1 : 0;
  return direction === 'ascending' ? result : -result;
}

const useStyles = makeStyles({
  root: {
    display: 'grid',
    alignContent: 'start',
    ...shorthands.gap('16px'),
    maxWidth: '1280px',
    ...shorthands.padding('24px', '32px', '32px'),
    '@media (max-width: 767px)': { ...shorthands.padding('16px', '16px', '24px') },
  },
  head: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', ...shorthands.gap('12px', '24px') },
  titles: { display: 'grid', ...shorthands.gap('2px'), marginRight: 'auto' },
  muted: { color: tokens.colorNeutralForeground3 },
  alert: { color: tokens.colorPaletteRedForeground1, fontWeight: tokens.fontWeightSemibold },
  search: { width: '320px', '@media (max-width: 767px)': { width: '100%' } },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow4,
    ...shorthands.overflow('hidden'),
  },
  row: { cursor: 'pointer' },
  rowAnomaly: { backgroundColor: tokens.colorPaletteRedBackground1, ':hover': { backgroundColor: tokens.colorPaletteRedBackground2 } },
  num: { fontVariantNumeric: 'tabular-nums' },
  danger: { color: tokens.colorPaletteRedForeground1, fontWeight: tokens.fontWeightSemibold },
  empty: { ...shorthands.padding('24px', '20px'), color: tokens.colorNeutralForeground2 },
  list: { listStyleType: 'none', ...shorthands.margin(0), ...shorthands.padding(0) },
  mobileItem: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr auto',
    ...shorthands.gap('4px', '12px'),
    alignItems: 'center',
    ...shorthands.padding('14px', '16px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke3),
    color: tokens.colorNeutralForeground1,
    textDecorationLine: 'none',
    ':focus-visible': { outlineWidth: '2px', outlineStyle: 'solid', outlineColor: tokens.colorStrokeFocus2, outlineOffset: '-2px' },
  },
  mobileAnomaly: { backgroundColor: tokens.colorPaletteRedBackground1 },
  mobileBody: { display: 'grid', ...shorthands.gap('2px'), minWidth: 0 },
  mobileMetrics: { gridColumn: '2 / 4', color: tokens.colorNeutralForeground2, fontVariantNumeric: 'tabular-nums' },
  ellipsis: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
});

export default function PatientsPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const now = useNow(30000);
  const { status, error, patients, refresh, query, setQuery } = useMonitoring();
  const [sort, setSort] = useState({ column: 'status', direction: 'ascending' });

  const rows = useMemo(() => {
    const column = COLUMNS.find((c) => c.id === sort.column);
    const byTime = COLUMNS.find((c) => c.id === 'recorded_at');
    return patients
      .filter((p) => matchesQuery(p, query))
      .sort((a, b) => compare(a, b, column, sort.direction) || compare(a, b, byTime, 'descending'));
  }, [patients, query, sort]);

  const anomalyCount = patients.filter((p) => p.status === 'ANOMALI').length;
  const open = (p) => navigate(`/pasien/${encodeURIComponent(p.id)}`);
  const toggleSort = (id) =>
    setSort((s) => ({
      column: id,
      direction: s.column === id && s.direction === 'ascending' ? 'descending' : 'ascending',
    }));

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <div className={styles.titles}>
          <Title2 as="h1">Pasien</Title2>
          {status === 'ready' && (
            <Caption1 className={styles.muted}>
              {patients.length} pasien dipantau
              {anomalyCount > 0 && (
                <>
                  {' · '}
                  <span className={styles.alert}>{anomalyCount} anomali pada pengukuran terakhir</span>
                </>
              )}
            </Caption1>
          )}
        </div>
        <SearchBox
          className={styles.search}
          placeholder="Cari nama atau email"
          value={query}
          onChange={(_, d) => setQuery(d.value)}
          aria-label="Cari pasien"
        />
      </div>

      {error && <LoadError error={error} onRetry={refresh} stale={status === 'ready'} />}

      {status === 'loading' ? (
        <div className={styles.card} style={{ padding: 16 }}>
          <ListSkeleton rows={5} />
        </div>
      ) : status === 'ready' && (
        <div className={styles.card}>
          {rows.length === 0 ? (
            <Body1 as="p" className={styles.empty}>
              {patients.length === 0
                ? 'Belum ada pasien dengan peran patient di database.'
                : `Tidak ada pasien yang cocok dengan “${query.trim()}”.`}
            </Body1>
          ) : isMobile ? (
            <ul className={styles.list}>
              {rows.map((p) => (
                <li key={p.id}>
                  <RouterLink
                    to={`/pasien/${encodeURIComponent(p.id)}`}
                    className={mergeClasses(styles.mobileItem, p.status === 'ANOMALI' && styles.mobileAnomaly)}
                  >
                    <Avatar name={p.full_name} color="colorful" idForColor={p.id} size={40} />
                    <div className={styles.mobileBody}>
                      <Text weight="semibold" className={styles.ellipsis}>
                        {p.full_name}
                      </Text>
                      <Caption1 className={mergeClasses(styles.muted, styles.ellipsis)}>{p.email}</Caption1>
                    </div>
                    <StatusBadge status={p.status} size="small" />
                    <Caption1 className={styles.mobileMetrics}>
                      {p.recorded_at
                        ? `${formatNumber(p.heart_rate)} BPM · ${formatNumber(p.steps)} langkah · ${formatRelative(p.recorded_at, now)}`
                        : 'Belum ada pengukuran'}
                    </Caption1>
                  </RouterLink>
                </li>
              ))}
            </ul>
          ) : (
            <Table sortable aria-label="Daftar pasien">
              <TableHeader>
                <TableRow>
                  {COLUMNS.map((c) => (
                    <TableHeaderCell
                      key={c.id}
                      sortDirection={sort.column === c.id ? sort.direction : undefined}
                      onClick={() => toggleSort(c.id)}
                    >
                      {c.label}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => {
                  const anomaly = p.status === 'ANOMALI';
                  return (
                    <TableRow
                      key={p.id}
                      className={mergeClasses(styles.row, anomaly && styles.rowAnomaly)}
                      tabIndex={0}
                      onClick={() => open(p)}
                      onKeyDown={(e) => e.key === 'Enter' && open(p)}
                    >
                      <TableCell>
                        <StatusBadge status={p.status} size="small" />
                      </TableCell>
                      <TableCell>
                        <TableCellLayout
                          media={<Avatar name={p.full_name} color="colorful" idForColor={p.id} size={28} />}
                          description={p.email}
                        >
                          {p.full_name}
                        </TableCellLayout>
                      </TableCell>
                      <TableCell className={mergeClasses(styles.num, anomaly && styles.danger)}>
                        {p.heart_rate == null ? '—' : `${formatNumber(p.heart_rate)} BPM`}
                      </TableCell>
                      <TableCell className={styles.num}>{formatNumber(p.steps)}</TableCell>
                      <TableCell className={styles.num}>{formatNumber(p.risk_score)}</TableCell>
                      <TableCell>{formatShortDateTime(p.recorded_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
