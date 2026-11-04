import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Body1,
  Button,
  Caption1,
  Link,
  Subtitle2,
  Table,
  TableBody,
  TableCell,
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
import { Checkmark20Regular, CheckmarkCircle16Regular, Open20Regular, Sparkle20Filled } from '@fluentui/react-icons';
import AiNoteText, { stripMarkdown } from './AiNoteText';
import HeartRateChart from './HeartRateChart';
import { Disclaimer, StatusBadge } from './common';
import { formatDateTime, formatNumber, formatShortDateTime } from '../lib/format';
import { useIsMobile } from '../lib/hooks';
import { markSeen } from '../lib/seen';

const useStyles = makeStyles({
  root: { display: 'grid', ...shorthands.gap('16px'), alignContent: 'start' },
  head: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems: 'center',
    ...shorthands.gap('12px', '16px'),
    '@media (max-width: 1100px)': { gridTemplateColumns: 'auto minmax(0, 1fr)' },
  },
  identity: { display: 'grid', ...shorthands.gap('4px'), minWidth: 0 },
  nameRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', ...shorthands.gap('8px', '12px') },
  name: { overflowWrap: 'anywhere' },
  sub: { color: tokens.colorNeutralForeground3, overflowWrap: 'anywhere' },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    '@media (max-width: 1100px)': { gridColumn: '1 / -1' },
  },
  allSeen: { display: 'inline-flex', alignItems: 'center', ...shorthands.gap('6px'), color: tokens.colorNeutralForeground3 },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow4,
    minWidth: 0,
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    '@media (max-width: 1100px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
  metric: {
    display: 'grid',
    ...shorthands.gap('2px'),
    ...shorthands.padding('14px', '20px'),
    ...shorthands.borderLeft('1px', 'solid', tokens.colorNeutralStroke3),
    ':first-child': { ...shorthands.borderLeft('0', 'none', 'transparent') },
    '@media (max-width: 1100px)': {
      ':nth-child(3)': { ...shorthands.borderLeft('0', 'none', 'transparent') },
      ':nth-child(n+3)': { ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke3) },
    },
  },
  metricLabel: { color: tokens.colorNeutralForeground3 },
  metricValue: {
    fontSize: tokens.fontSizeHero700,
    lineHeight: tokens.lineHeightHero700,
    fontWeight: tokens.fontWeightSemibold,
    fontVariantNumeric: 'tabular-nums',
    '@media (max-width: 767px)': { fontSize: tokens.fontSizeBase600, lineHeight: tokens.lineHeightBase600 },
  },
  unit: { fontSize: tokens.fontSizeBase300, fontWeight: tokens.fontWeightRegular, color: tokens.colorNeutralForeground3, marginLeft: '4px' },
  danger: { color: tokens.colorPaletteRedForeground1 },
  selection: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    ...shorthands.gap('4px', '12px'),
    ...shorthands.padding('10px', '20px'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke3),
    color: tokens.colorNeutralForeground3,
  },
  split: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
    ...shorthands.gap('16px'),
    alignItems: 'start',
    '@media (max-width: 1100px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
  ai: {
    display: 'grid',
    ...shorthands.gap('10px'),
    ...shorthands.padding('16px', '20px'),
    backgroundColor: tokens.colorPalettePurpleBackground1,
    boxShadow: 'none',
    ...shorthands.border('1px', 'solid', tokens.colorPalettePurpleBorder1),
  },
  aiHead: { display: 'flex', alignItems: 'center', ...shorthands.gap('8px'), color: tokens.colorPalettePurpleForeground2 },
  aiMeta: { color: tokens.colorNeutralForeground3 },
  tableCard: { ...shorthands.padding('16px', '0', '4px') },
  tableHead: { display: 'flex', alignItems: 'baseline', ...shorthands.gap('8px'), ...shorthands.padding('0', '20px', '8px') },
  tableScroll: { maxHeight: '380px', overflowY: 'auto' },
  stickyHead: { position: 'sticky', top: 0, backgroundColor: tokens.colorNeutralBackground1, zIndex: 1 },
  num: { fontVariantNumeric: 'tabular-nums' },
  nowrap: { whiteSpace: 'nowrap' },
  row: { cursor: 'pointer' },
  rowAnomaly: { backgroundColor: tokens.colorPaletteRedBackground1, ':hover': { backgroundColor: tokens.colorPaletteRedBackground2 } },
  rowSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ':hover': { backgroundColor: tokens.colorBrandBackground2Hover },
  },
  noteCell: { maxWidth: '0', width: '40%' },
  noteText: { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: tokens.colorNeutralForeground2 },
  emptyCard: { ...shorthands.padding('24px', '20px'), color: tokens.colorNeutralForeground2 },
});

function Metric({ label, value, unit, danger }) {
  const styles = useStyles();
  return (
    <div className={styles.metric}>
      <Caption1 className={styles.metricLabel}>{label}</Caption1>
      <span className={mergeClasses(styles.metricValue, danger && styles.danger)}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
    </div>
  );
}

function HistoryTable({ events, selectedKey, onSelect }) {
  const styles = useStyles();
  const isMobile = useIsMobile();
  return (
    <section className={mergeClasses(styles.card, styles.tableCard)} aria-label="Riwayat pengukuran">
      <div className={styles.tableHead}>
        <Subtitle2 as="h2">Riwayat pengukuran</Subtitle2>
        <Caption1 className={styles.aiMeta}>{events.length} terbaru, maks. 100</Caption1>
      </div>
      <div className={styles.tableScroll}>
        <Table size="small" aria-label="Riwayat pengukuran pasien">
          <TableHeader className={styles.stickyHead}>
            <TableRow>
              <TableHeaderCell>Waktu (WIB)</TableHeaderCell>
              <TableHeaderCell>BPM</TableHeaderCell>
              <TableHeaderCell>Langkah</TableHeaderCell>
              {!isMobile && <TableHeaderCell>Skor</TableHeaderCell>}
              <TableHeaderCell>Status</TableHeaderCell>
              {!isMobile && <TableHeaderCell className={styles.noteCell}>Catatan AI</TableHeaderCell>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow
                key={e.key}
                className={mergeClasses(
                  styles.row,
                  e.is_anomaly && styles.rowAnomaly,
                  e.key === selectedKey && styles.rowSelected,
                )}
                aria-current={e.key === selectedKey || undefined}
                tabIndex={0}
                onClick={() => onSelect(e)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    onSelect(e);
                  }
                }}
              >
                <TableCell className={styles.nowrap}>{formatShortDateTime(e.recorded_at)}</TableCell>
                <TableCell className={mergeClasses(styles.num, e.is_anomaly && styles.danger)}>
                  {formatNumber(e.heart_rate)}
                </TableCell>
                <TableCell className={styles.num}>{formatNumber(e.steps)}</TableCell>
                {!isMobile && <TableCell className={styles.num}>{formatNumber(e.risk_score)}</TableCell>}
                <TableCell>
                  <StatusBadge status={e.status} size="small" />
                </TableCell>
                {!isMobile && (
                  <TableCell className={styles.noteCell}>
                    <span className={styles.noteText}>{e.ai_note ? stripMarkdown(e.ai_note) : '—'}</span>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default function PatientDetail({ patient, events, selectedKey, onSelect, showOpenPage = false }) {
  const styles = useStyles();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const selected = events.find((e) => e.key === selectedKey) ?? events[0];
  const latest = events[0];
  const unseen = events.filter((e) => e.unseen);
  const anomalyCount = events.filter((e) => e.is_anomaly).length;
  const headerStatus = latest ? latest.status : patient.status ?? 'BELUM ADA DATA';

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <Avatar name={patient.full_name} color="colorful" idForColor={patient.id} size={isMobile ? 48 : 56} />
        <div className={styles.identity}>
          <div className={styles.nameRow}>
            <Title2 as="h2" className={styles.name}>
              {patient.full_name}
            </Title2>
            <StatusBadge status={headerStatus} size="large" />
          </div>
          <Caption1 className={styles.sub}>
            {patient.email}
            {latest ? ` · pengukuran terakhir ${formatDateTime(latest.recorded_at)}` : ' · belum ada pengukuran'}
          </Caption1>
        </div>
        <div className={styles.actions}>
          {unseen.length > 0 ? (
            <Button appearance="primary" icon={<Checkmark20Regular />} onClick={() => markSeen(unseen.map((e) => e.key))}>
              Tandai sudah dilihat{unseen.length > 1 ? ` (${unseen.length})` : ''}
            </Button>
          ) : (
            anomalyCount > 0 && (
              <Caption1 className={styles.allSeen}>
                <CheckmarkCircle16Regular aria-hidden />
                Semua anomali sudah dilihat
              </Caption1>
            )
          )}
          {showOpenPage && (
            <Button icon={<Open20Regular />} onClick={() => navigate(`/pasien/${encodeURIComponent(patient.id)}`)}>
              Halaman pasien
            </Button>
          )}
        </div>
      </div>

      {!selected ? (
        <div className={mergeClasses(styles.card, styles.emptyCard)}>
          <Body1>
            Pasien ini belum memiliki pengukuran. Riwayat, grafik, dan catatan AI akan muncul setelah data detak jantung
            dan langkah dikirim.
          </Body1>
        </div>
      ) : (
        <>
          <section className={styles.card} aria-label="Pengukuran terpilih">
            <div className={styles.metrics}>
              <Metric label="Detak jantung" value={formatNumber(selected.heart_rate)} unit="BPM" danger={selected.is_anomaly} />
              <Metric label="Langkah" value={formatNumber(selected.steps)} />
              <Metric label="Skor risiko (prototipe)" value={formatNumber(selected.risk_score)} danger={selected.is_anomaly} />
              <Metric label="Anomali tercatat" value={anomalyCount} unit={`dari ${events.length}`} />
            </div>
            <Caption1 as="div" className={styles.selection}>
              <StatusBadge status={selected.status} size="small" muted={selected.is_anomaly && !selected.unseen} />
              <span>
                {selected === latest ? 'Pengukuran terbaru' : 'Pengukuran terpilih'} · {formatDateTime(selected.recorded_at)}
              </span>
              {selected !== latest && (
                <Link as="button" onClick={() => onSelect(latest)}>
                  Kembali ke terbaru
                </Link>
              )}
            </Caption1>
          </section>

          <div className={styles.split}>
            <HeartRateChart events={events} selectedKey={selected.key} onSelect={onSelect} />
            <section className={mergeClasses(styles.card, styles.ai)} aria-label="Catatan AI">
              <div className={styles.aiHead}>
                <Sparkle20Filled aria-hidden />
                <Subtitle2 as="h2">Catatan AI</Subtitle2>
              </div>
              {selected.ai_note ? (
                <AiNoteText key={selected.key} text={selected.ai_note} />
              ) : (
                <Text as="p">Tidak ada catatan AI untuk pengukuran ini.</Text>
              )}
              <Caption1 className={styles.aiMeta}>
                Dibuat Google Gemini dari dua angka (BPM dan langkah) pada {formatShortDateTime(selected.recorded_at)}.
                Bukan diagnosis.
              </Caption1>
            </section>
          </div>

          <HistoryTable events={events} selectedKey={selected.key} onSelect={onSelect} />
        </>
      )}

      <Disclaimer />
    </div>
  );
}
