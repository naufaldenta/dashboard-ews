import { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Caption1, Subtitle2, Tab, TabList, Text, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import { useThemeMode } from '../theme';
import { formatAxisTime, formatDateTime, formatNumber } from '../lib/format';
import { useIsMobile } from '../lib/hooks';

const RANGES = [
  { id: '24h', label: '24 jam', ms: 24 * 3600 * 1000 },
  { id: '7d', label: '7 hari', ms: 7 * 24 * 3600 * 1000 },
  { id: 'all', label: 'Semua', ms: Infinity },
];

const THRESHOLD = 100;

const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow4,
    ...shorthands.padding('16px', '20px', '8px'),
    minWidth: 0,
  },
  head: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', ...shorthands.gap('8px', '16px') },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('4px', '16px'),
    color: tokens.colorNeutralForeground3,
    marginTop: '8px',
    marginBottom: '4px',
  },
  key: { display: 'inline-flex', alignItems: 'center', ...shorthands.gap('6px') },
  swatch: { display: 'inline-block', width: '12px', height: '3px', ...shorthands.borderRadius('2px') },
  dotSwatch: { width: '8px', height: '8px', ...shorthands.borderRadius('50%') },
  barSwatch: { height: '10px', width: '8px', ...shorthands.borderRadius('1px') },
  empty: {
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    ...shorthands.padding('24px'),
  },
  tooltip: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    boxShadow: tokens.shadow16,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding('8px', '12px'),
    display: 'grid',
    ...shorthands.gap('2px'),
    fontVariantNumeric: 'tabular-nums',
  },
  tipAnomaly: { color: tokens.colorPaletteRedForeground1, fontWeight: tokens.fontWeightSemibold },
});

function ChartTooltip({ active, payload }) {
  const styles = useStyles();
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <Caption1>{formatDateTime(point.recorded_at)}</Caption1>
      <Text weight="semibold">{formatNumber(point.heart_rate)} BPM</Text>
      <Caption1>{formatNumber(point.steps)} langkah</Caption1>
      <Caption1 className={point.is_anomaly ? styles.tipAnomaly : undefined}>{point.status}</Caption1>
    </div>
  );
}

export default function HeartRateChart({ events, selectedKey, onSelect }) {
  const styles = useStyles();
  const { theme } = useThemeMode();
  const isMobile = useIsMobile();
  const [range, setRange] = useState('all');

  const data = useMemo(() => {
    const span = RANGES.find((r) => r.id === range).ms;
    const latest = events[0]?.time ?? 0;
    return events.filter((e) => latest - e.time <= span).slice().reverse();
  }, [events, range]);

  const span = data.length > 1 ? data[data.length - 1].time - data[0].time : 0;
  const maxBpm = Math.max(THRESHOLD + 20, ...data.map((d) => d.heart_rate ?? 0));

  const colors = {
    line: theme.colorBrandForeground1,
    anomaly: theme.colorPaletteRedBorderActive,
    threshold: theme.colorPaletteRedForeground1,
    steps: theme.colorNeutralForeground3,
    grid: theme.colorNeutralStroke3,
    axis: theme.colorNeutralForeground3,
    surface: theme.colorNeutralBackground1,
  };

  const renderDot = ({ cx, cy, payload }) => {
    if (cx == null || cy == null) return null;
    const selected = payload.key === selectedKey;
    const r = payload.is_anomaly ? 5 : 3.5;
    return (
      <g key={payload.key} onClick={() => onSelect(payload)} style={{ cursor: 'pointer' }}>
        {selected && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={colors.line} strokeWidth={2} />}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={payload.is_anomaly ? colors.anomaly : colors.line}
          stroke={colors.surface}
          strokeWidth={1.5}
        />
      </g>
    );
  };

  return (
    <section className={styles.card} aria-label="Grafik detak jantung">
      <div className={styles.head}>
        <Subtitle2 as="h2">Detak jantung dan langkah</Subtitle2>
        <TabList size="small" selectedValue={range} onTabSelect={(_, d) => setRange(d.value)}>
          {RANGES.map((r) => (
            <Tab key={r.id} value={r.id}>
              {r.label}
            </Tab>
          ))}
        </TabList>
      </div>
      <Caption1 className={styles.legend} as="div">
        <span className={styles.key}>
          <span className={styles.swatch} style={{ backgroundColor: colors.line }} />
          BPM
        </span>
        <span className={styles.key}>
          <span className={mergeClasses(styles.swatch, styles.dotSwatch)} style={{ backgroundColor: colors.anomaly }} />
          Anomali
        </span>
        <span className={styles.key}>
          <span className={mergeClasses(styles.swatch, styles.barSwatch)} style={{ backgroundColor: colors.steps, opacity: 0.3 }} />
          Langkah
        </span>
        <span className={styles.key}>
          <span className={styles.swatch} style={{ borderTop: `2px dashed ${colors.threshold}`, height: 0 }} />
          Batas {THRESHOLD} BPM
        </span>
      </Caption1>

      {data.length === 0 ? (
        <div className={styles.empty} style={{ height: isMobile ? 200 : 260 }}>
          <Text>Tidak ada pengukuran dalam rentang ini. Pilih rentang yang lebih panjang.</Text>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
          <ComposedChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={colors.grid} />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={span ? ['dataMin', 'dataMax'] : ['dataMin - 3600000', 'dataMax + 3600000']}
              tickFormatter={(ms) => formatAxisTime(ms, span)}
              tick={{ fill: colors.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: colors.grid }}
              minTickGap={32}
              padding={{ left: 12, right: 12 }}
            />
            <YAxis
              yAxisId="bpm"
              domain={[40, Math.ceil(maxBpm / 10) * 10]}
              tick={{ fill: colors.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <YAxis yAxisId="steps" orientation="right" hide domain={[0, (max) => Math.max(max * 3, 50)]} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: colors.grid }} />
            <Bar yAxisId="steps" dataKey="steps" fill={colors.steps} fillOpacity={0.25} barSize={isMobile ? 6 : 10} isAnimationActive={false} />
            <ReferenceLine
              yAxisId="bpm"
              y={THRESHOLD}
              stroke={colors.threshold}
              strokeDasharray="6 4"
              label={{ value: `${THRESHOLD} BPM`, position: 'insideTopRight', fill: colors.threshold, fontSize: 11 }}
            />
            <Line
              yAxisId="bpm"
              dataKey="heart_rate"
              type="monotone"
              stroke={colors.line}
              strokeWidth={2.5}
              dot={renderDot}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
