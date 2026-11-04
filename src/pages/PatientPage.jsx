import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Body1, Button, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { ArrowLeft20Regular } from '@fluentui/react-icons';
import PatientDetail from '../components/PatientDetail';
import { ListSkeleton, LoadError } from '../components/common';
import { useMonitoring } from '../data/MonitoringContext';

const useStyles = makeStyles({
  root: {
    display: 'grid',
    alignContent: 'start',
    ...shorthands.gap('16px'),
    maxWidth: '1280px',
    ...shorthands.padding('16px', '32px', '32px'),
    '@media (max-width: 767px)': { ...shorthands.padding('12px', '16px', '24px') },
  },
  back: { justifySelf: 'start', marginLeft: '-8px' },
  muted: { color: tokens.colorNeutralForeground2 },
});

export default function PatientPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { status, error, patientById, eventsById, refresh } = useMonitoring();

  const patient = patientById[id];
  const events = eventsById[id] ?? [];
  const time = params.get('t');
  const selectedKey = time ? `${id}|${time}` : events[0]?.key;

  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/pasien'));

  return (
    <div className={styles.root}>
      <Button className={styles.back} appearance="subtle" icon={<ArrowLeft20Regular />} onClick={goBack}>
        Kembali
      </Button>
      {error && <LoadError error={error} onRetry={refresh} stale={status === 'ready'} />}
      {status === 'loading' ? (
        <ListSkeleton rows={4} />
      ) : patient ? (
        <PatientDetail
          patient={patient}
          events={events}
          selectedKey={selectedKey}
          onSelect={(e) => setParams({ t: e.recorded_at }, { replace: true })}
        />
      ) : (
        status === 'ready' && (
          <Body1 className={styles.muted}>
            Pasien tidak ditemukan. Mungkin datanya sudah dihapus atau tautannya salah.
          </Body1>
        )
      )}
    </div>
  );
}
