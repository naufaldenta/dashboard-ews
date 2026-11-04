import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Body1,
  Button,
  Caption1,
  SearchBox,
  Text,
  Title3,
  ToggleButton,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { CheckmarkCircle20Regular } from '@fluentui/react-icons';
import { StatusBadge } from './common';
import { formatNumber, formatRelative } from '../lib/format';
import { useIsMobile, useNow } from '../lib/hooks';
import { markSeen } from '../lib/seen';

const PAGE_SIZE = 40;

const FILTERS = [
  { id: 'all', label: 'Semua', test: () => true },
  { id: 'anomaly', label: 'Anomali', test: (e) => e.is_anomaly },
  { id: 'unseen', label: 'Belum dilihat', test: (e) => e.unseen },
];

const pulse = {
  '0%': { boxShadow: '0 0 0 0 rgba(209, 52, 56, 0.55)' },
  '70%': { boxShadow: '0 0 0 7px rgba(209, 52, 56, 0)' },
  '100%': { boxShadow: '0 0 0 0 rgba(209, 52, 56, 0)' },
};

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' },
  head: {
    display: 'grid',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px', '16px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  titleRow: { display: 'flex', alignItems: 'center', ...shorthands.gap('8px') },
  titleText: { display: 'grid', marginRight: 'auto' },
  sub: { color: tokens.colorNeutralForeground3 },
  subAlert: { color: tokens.colorPaletteRedForeground1, fontWeight: tokens.fontWeightSemibold },
  filters: { display: 'flex', flexWrap: 'wrap', ...shorthands.gap('8px') },
  list: { listStyleType: 'none', ...shorthands.margin(0), ...shorthands.padding(0), overflowY: 'auto', flex: 1 },
  item: {
    display: 'grid',
    gridTemplateColumns: '36px 1fr auto',
    ...shorthands.gap('12px'),
    width: '100%',
    ...shorthands.padding('12px', '16px'),
    ...shorthands.border('0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke3),
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground1,
    textAlign: 'left',
    textDecorationLine: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transitionProperty: 'background-color',
    transitionDuration: tokens.durationFaster,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
    ':focus-visible': {
      outlineWidth: '2px',
      outlineStyle: 'solid',
      outlineColor: tokens.colorStrokeFocus2,
      outlineOffset: '-2px',
    },
  },
  unseen: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    ':hover': { backgroundColor: tokens.colorPaletteRedBackground2 },
  },
  selected: {
    backgroundColor: tokens.colorBrandBackground2,
    ':hover': { backgroundColor: tokens.colorBrandBackground2Hover },
  },
  body: { display: 'grid', ...shorthands.gap('2px'), minWidth: 0 },
  name: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  nameUnseen: { fontWeight: tokens.fontWeightBold },
  metrics: { color: tokens.colorNeutralForeground2, fontVariantNumeric: 'tabular-nums' },
  badgeRow: { display: 'flex', alignItems: 'center', ...shorthands.gap('6px'), marginTop: '4px' },
  seenNote: { color: tokens.colorNeutralForeground3 },
  meta: { display: 'grid', justifyItems: 'end', alignContent: 'start', ...shorthands.gap('8px') },
  time: { color: tokens.colorNeutralForeground3, whiteSpace: 'nowrap' },
  dot: {
    width: '10px',
    height: '10px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: tokens.colorPaletteRedBackground3,
    animationName: pulse,
    animationDuration: '1.8s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none' },
  },
  empty: {
    display: 'grid',
    justifyItems: 'start',
    ...shorthands.gap('12px'),
    ...shorthands.padding('24px', '16px'),
    color: tokens.colorNeutralForeground2,
  },
  more: { ...shorthands.padding('12px', '16px') },
});

function FeedItem({ event, selected, href, onSelect, now }) {
  const styles = useStyles();
  const ref = useRef(null);

  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const { patient } = event;
  const seenAnomaly = event.is_anomaly && !event.unseen;
  const label = `${patient.full_name}, ${event.heart_rate} BPM, ${event.steps} langkah, ${event.status}${
    event.unseen ? ', belum dilihat' : ''
  }`;
  const className = mergeClasses(styles.item, event.unseen && styles.unseen, selected && styles.selected);
  const content = (
    <>
      <Avatar name={patient.full_name} color="colorful" size={36} idForColor={patient.id} />
      <div className={styles.body}>
        <Body1 className={mergeClasses(styles.name, event.unseen && styles.nameUnseen)}>{patient.full_name}</Body1>
        <Caption1 className={styles.metrics}>
          {formatNumber(event.heart_rate)} BPM · {formatNumber(event.steps)} langkah · skor{' '}
          {formatNumber(event.risk_score)}
        </Caption1>
        <div className={styles.badgeRow}>
          <StatusBadge status={event.status} size="small" muted={seenAnomaly} />
          {seenAnomaly && <Caption1 className={styles.seenNote}>sudah dilihat</Caption1>}
        </div>
      </div>
      <div className={styles.meta}>
        <Caption1 className={styles.time}>{formatRelative(event.recorded_at, now)}</Caption1>
        {event.unseen && <span className={styles.dot} aria-hidden />}
      </div>
    </>
  );

  return (
    <li>
      {href ? (
        <RouterLink to={href} className={className} aria-label={label}>
          {content}
        </RouterLink>
      ) : (
        <button ref={ref} type="button" className={className} aria-label={label} aria-current={selected || undefined} onClick={onSelect}>
          {content}
        </button>
      )}
    </li>
  );
}

export default function ActivityFeed({ events, totalCount, selectedKey, onSelect, query, onQueryChange }) {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const now = useNow(30000);
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const unseen = events.filter((e) => e.unseen);
  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, events.filter(f.test).length]));
  const visible = events.filter(FILTERS.find((f) => f.id === filter).test);

  return (
    <section className={styles.root} aria-label="Umpan aktivitas">
      <div className={styles.head}>
        <div className={styles.titleRow}>
          <div className={styles.titleText}>
            <Title3 as="h1">Aktivitas</Title3>
            {unseen.length > 0 ? (
              <Caption1 className={styles.subAlert}>{unseen.length} anomali belum dilihat</Caption1>
            ) : (
              <Caption1 className={styles.sub}>Tidak ada anomali baru</Caption1>
            )}
          </div>
          {unseen.length > 0 && (
            <Button
              appearance="subtle"
              size="small"
              icon={<CheckmarkCircle20Regular />}
              onClick={() => markSeen(unseen.map((e) => e.key))}
            >
              Tandai semua dilihat
            </Button>
          )}
        </div>
        {isMobile && (
          <SearchBox
            placeholder="Cari pasien"
            value={query}
            onChange={(_, data) => onQueryChange(data.value)}
            aria-label="Cari pasien"
          />
        )}
        <div className={styles.filters} role="group" aria-label="Saring aktivitas">
          {FILTERS.map((f) => (
            <ToggleButton
              key={f.id}
              size="small"
              shape="circular"
              checked={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                setLimit(PAGE_SIZE);
              }}
            >
              {f.label} · {counts[f.id]}
            </ToggleButton>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          {totalCount === 0 ? (
            <>
              <Text>
                Belum ada pengukuran. Data muncul setelah aplikasi mobile mengirim detak jantung dan langkah, atau
                setelah Anda mengirim data uji.
              </Text>
              <Button appearance="primary" onClick={() => navigate('/data-uji')}>
                Kirim data uji
              </Button>
            </>
          ) : query.trim() && events.length === 0 ? (
            <Text>Tidak ada pasien yang cocok dengan “{query.trim()}”.</Text>
          ) : filter === 'unseen' ? (
            <Text>Semua anomali sudah dilihat.</Text>
          ) : (
            <Text>Tidak ada anomali pada data yang dimuat.</Text>
          )}
        </div>
      ) : (
        <ul className={styles.list}>
          {visible.slice(0, limit).map((event) => (
            <FeedItem
              key={event.key}
              event={event}
              now={now}
              selected={!isMobile && event.key === selectedKey}
              href={
                isMobile
                  ? `/pasien/${encodeURIComponent(event.user_id)}?t=${encodeURIComponent(event.recorded_at)}`
                  : undefined
              }
              onSelect={() => onSelect(event)}
            />
          ))}
          {visible.length > limit && (
            <li className={styles.more}>
              <Button appearance="secondary" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                Tampilkan {Math.min(PAGE_SIZE, visible.length - limit)} lagi
              </Button>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
