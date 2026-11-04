import { NavLink } from 'react-router-dom';
import {
  Button,
  CounterBadge,
  SearchBox,
  Tooltip,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Alert24Filled,
  Alert24Regular,
  ArrowClockwise20Regular,
  Beaker24Filled,
  Beaker24Regular,
  HeartPulse24Regular,
  People24Filled,
  People24Regular,
  WeatherMoon20Regular,
  WeatherSunny20Regular,
  bundleIcon,
} from '@fluentui/react-icons';
import { useMonitoring } from '../data/MonitoringContext';
import { useThemeMode } from '../theme';
import { useIsMobile, useNow } from '../lib/hooks';
import { formatAgo } from '../lib/format';

const ActivityIcon = bundleIcon(Alert24Filled, Alert24Regular);
const PatientsIcon = bundleIcon(People24Filled, People24Regular);
const TestIcon = bundleIcon(Beaker24Filled, Beaker24Regular);

const NAV = [
  { to: '/', label: 'Aktivitas', icon: ActivityIcon, end: true, counter: true },
  { to: '/pasien', label: 'Pasien', icon: PatientsIcon },
  { to: '/data-uji', label: 'Data uji', icon: TestIcon },
];

const onBrandHover = {
  color: tokens.colorNeutralForegroundOnBrand,
  backgroundColor: 'rgba(255, 255, 255, 0.14)',
};

const useStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateRows: '48px 1fr',
    height: '100dvh',
    '@media (max-width: 767px)': { gridTemplateRows: '48px 1fr 60px' },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('0', '12px', '0', '16px'),
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    zIndex: 2,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    minWidth: '0',
    color: 'inherit',
    textDecorationLine: 'none',
  },
  brandName: { fontSize: tokens.fontSizeBase400, fontWeight: tokens.fontWeightSemibold, whiteSpace: 'nowrap' },
  brandSub: {
    fontSize: tokens.fontSizeBase200,
    opacity: 0.85,
    whiteSpace: 'nowrap',
    '@media (max-width: 1023px)': { display: 'none' },
  },
  search: {
    width: '100%',
    maxWidth: '440px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  actions: { display: 'flex', alignItems: 'center', ...shorthands.gap('4px'), marginLeft: 'auto' },
  status: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    fontSize: tokens.fontSizeBase200,
    marginRight: '8px',
    whiteSpace: 'nowrap',
  },
  statusDot: { width: '8px', height: '8px', ...shorthands.borderRadius('50%'), flexShrink: 0 },
  dotOk: { backgroundColor: tokens.colorPaletteLightGreenBorderActive },
  dotErr: { backgroundColor: tokens.colorPaletteMarigoldBorderActive },
  dotWait: { backgroundColor: 'rgba(255, 255, 255, 0.6)' },
  headerButton: {
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': onBrandHover,
    ':hover:active': onBrandHover,
  },
  spin: {
    '& svg': {
      animationName: { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
      animationDuration: '0.9s',
      animationIterationCount: 'infinite',
      animationTimingFunction: 'linear',
    },
  },
  body: { display: 'flex', minHeight: 0 },
  rail: {
    width: '68px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    paddingTop: '8px',
    backgroundColor: tokens.colorNeutralBackground5,
  },
  main: { flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' },
  bottomNav: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'stretch',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  navItem: {
    position: 'relative',
    width: '60px',
    height: '56px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('2px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    lineHeight: tokens.lineHeightBase100,
    textDecorationLine: 'none',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, color: tokens.colorNeutralForeground2 },
    ':focus-visible': { outlineWidth: '2px', outlineStyle: 'solid', outlineColor: tokens.colorStrokeFocus2 },
  },
  navItemMobile: { flex: 1, width: 'auto', ...shorthands.borderRadius('0') },
  navActive: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground1,
    ':hover': { color: tokens.colorBrandForeground1, backgroundColor: tokens.colorNeutralBackground1 },
  },
  navActiveMobile: { backgroundColor: 'transparent', ':hover': { backgroundColor: 'transparent' } },
  counter: { position: 'absolute', top: '5px', left: '50%', marginLeft: '4px' },
});

function NavItems({ mobile }) {
  const styles = useStyles();
  const { unseenCount } = useMonitoring();
  return NAV.map(({ to, label, icon: Icon, end, counter }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) =>
        mergeClasses(
          styles.navItem,
          mobile && styles.navItemMobile,
          isActive && styles.navActive,
          isActive && mobile && styles.navActiveMobile,
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon filled={isActive} aria-hidden />
          <span>{label}</span>
          {counter && unseenCount > 0 && (
            <CounterBadge
              className={styles.counter}
              count={unseenCount}
              color="danger"
              size="small"
              overflowCount={99}
              aria-label={`${unseenCount} anomali belum dilihat`}
            />
          )}
        </>
      )}
    </NavLink>
  ));
}

export default function AppShell({ children }) {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const now = useNow();
  const { mode, toggle } = useThemeMode();
  const { status, error, updatedAt, refreshing, refresh, query, setQuery } = useMonitoring();

  const offline = Boolean(error);
  const statusText =
    status === 'loading' ? 'Menghubungkan…' : offline ? 'Gagal memuat data' : `Online · ${formatAgo(updatedAt, now)}`;
  const statusDot = (
    <span
      className={mergeClasses(
        styles.statusDot,
        status === 'loading' ? styles.dotWait : offline ? styles.dotErr : styles.dotOk,
      )}
    />
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand} aria-label="Telehealth EWS, ke Aktivitas">
          <HeartPulse24Regular aria-hidden />
          <span className={styles.brandName}>Telehealth EWS</span>
          <span className={styles.brandSub}>Dashboard Dokter</span>
        </NavLink>

        {!isMobile && (
          <SearchBox
            className={styles.search}
            placeholder="Cari pasien (nama atau email)"
            value={query}
            onChange={(_, data) => setQuery(data.value)}
            aria-label="Cari pasien"
          />
        )}

        <div className={styles.actions}>
          {isMobile ? (
            <Tooltip content={`Backend: ${statusText}`} relationship="label">
              <span className={styles.status} role="status" tabIndex={0}>
                {statusDot}
              </span>
            </Tooltip>
          ) : (
            <span className={styles.status} role="status">
              {statusDot}
              {statusText}
            </span>
          )}
          <Tooltip content="Muat ulang data" relationship="label">
            <Button
              appearance="transparent"
              className={mergeClasses(styles.headerButton, refreshing && styles.spin)}
              icon={<ArrowClockwise20Regular />}
              onClick={refresh}
            />
          </Tooltip>
          <Tooltip content={mode === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'} relationship="label">
            <Button
              appearance="transparent"
              className={styles.headerButton}
              icon={mode === 'dark' ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />}
              onClick={toggle}
            />
          </Tooltip>
        </div>
      </header>

      <div className={styles.body}>
        {!isMobile && (
          <nav className={styles.rail} aria-label="Navigasi utama">
            <NavItems />
          </nav>
        )}
        <main className={styles.main}>{children}</main>
      </div>

      {isMobile && (
        <nav className={styles.bottomNav} aria-label="Navigasi utama">
          <NavItems mobile />
        </nav>
      )}
    </div>
  );
}
