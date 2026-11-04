import {
  Badge,
  Button,
  Caption1,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Skeleton,
  SkeletonItem,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  CheckmarkCircle12Filled,
  Info16Regular,
  QuestionCircle12Regular,
  Warning12Filled,
} from '@fluentui/react-icons';

const BADGES = {
  ANOMALI: { color: 'danger', appearance: 'filled', icon: <Warning12Filled /> },
  NORMAL: { color: 'success', appearance: 'tint', icon: <CheckmarkCircle12Filled /> },
  'BELUM ADA DATA': { color: 'informative', appearance: 'tint', icon: <QuestionCircle12Regular /> },
};

export function StatusBadge({ status, size = 'medium', muted = false }) {
  const config = BADGES[status] ?? BADGES['BELUM ADA DATA'];
  return (
    <Badge
      color={muted && status === 'ANOMALI' ? 'danger' : config.color}
      appearance={muted && status === 'ANOMALI' ? 'tint' : config.appearance}
      icon={config.icon}
      size={size}
      shape="rounded"
    >
      {status}
    </Badge>
  );
}

const useStyles = makeStyles({
  disclaimer: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'flex-start',
    color: tokens.colorNeutralForeground3,
    maxWidth: '72ch',
  },
  disclaimerIcon: { flexShrink: 0, marginTop: '1px' },
  skeleton: { display: 'grid', ...shorthands.gap('12px') },
  skeletonRow: { display: 'grid', gridTemplateColumns: '36px 1fr', ...shorthands.gap('12px'), alignItems: 'center' },
  skeletonLines: { display: 'grid', ...shorthands.gap('6px') },
});

export function Disclaimer() {
  const styles = useStyles();
  return (
    <Caption1 as="p" className={styles.disclaimer}>
      <Info16Regular className={styles.disclaimerIcon} aria-hidden />
      Status dan skor risiko berasal dari aturan prototipe (detak jantung di atas 100 BPM saat langkah 0) yang belum
      divalidasi secara klinis. Ini bukan alat diagnosis dan tidak untuk keputusan medis.
    </Caption1>
  );
}

export function LoadError({ error, onRetry, stale = false }) {
  return (
    <MessageBar intent={stale ? 'warning' : 'error'} layout="multiline">
      <MessageBarBody>
        <MessageBarTitle>{stale ? 'Data mungkin tidak terbaru' : 'Data pasien gagal dimuat'}</MessageBarTitle>
        {error?.message}
        {stale ? ' Menampilkan data terakhir yang berhasil dimuat.' : ''}
      </MessageBarBody>
      {onRetry && (
        <MessageBarActions>
          <Button onClick={onRetry}>Coba lagi</Button>
        </MessageBarActions>
      )}
    </MessageBar>
  );
}

export function ListSkeleton({ rows = 6 }) {
  const styles = useStyles();
  return (
    <Skeleton aria-label="Memuat data" className={styles.skeleton}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.skeletonRow}>
          <SkeletonItem shape="circle" size={36} />
          <div className={styles.skeletonLines}>
            <SkeletonItem size={16} style={{ width: '55%' }} />
            <SkeletonItem size={12} style={{ width: '80%' }} />
          </div>
        </div>
      ))}
    </Skeleton>
  );
}
