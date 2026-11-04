import { useNavigate } from 'react-router-dom';
import { Body1, Button, Title2, makeStyles, shorthands } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: { display: 'grid', justifyItems: 'start', ...shorthands.gap('12px'), ...shorthands.padding('32px') },
});

export default function NotFoundPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  return (
    <div className={styles.root}>
      <Title2 as="h1">Halaman tidak ditemukan</Title2>
      <Body1>Alamat ini tidak ada di dashboard.</Body1>
      <Button appearance="primary" onClick={() => navigate('/')}>
        Ke Aktivitas
      </Button>
    </div>
  );
}
