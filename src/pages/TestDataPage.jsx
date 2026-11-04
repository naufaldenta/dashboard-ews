import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Body1,
  Button,
  Caption1,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  Spinner,
  Subtitle2,
  Text,
  Title2,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { Send20Regular, Sparkle20Filled } from '@fluentui/react-icons';
import AiNoteText from '../components/AiNoteText';
import { Disclaimer, StatusBadge } from '../components/common';
import { useMonitoring } from '../data/MonitoringContext';
import { analyze } from '../lib/api';
import { formatDateTime, formatNumber, nowWibInputValue, wibInputToIso } from '../lib/format';

const PRESETS = [
  { label: 'Contoh normal', hint: '85 BPM, 100 langkah', heartRate: '85', steps: '100' },
  { label: 'Contoh anomali', hint: '120 BPM, 0 langkah', heartRate: '120', steps: '0' },
];

const useStyles = makeStyles({
  root: {
    display: 'grid',
    alignContent: 'start',
    ...shorthands.gap('16px'),
    maxWidth: '1100px',
    ...shorthands.padding('24px', '32px', '32px'),
    '@media (max-width: 767px)': { ...shorthands.padding('16px', '16px', '24px') },
  },
  intro: { display: 'grid', ...shorthands.gap('4px'), maxWidth: '70ch' },
  muted: { color: tokens.colorNeutralForeground3 },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    ...shorthands.gap('16px'),
    alignItems: 'start',
    '@media (max-width: 900px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow4,
    ...shorthands.padding('20px'),
    display: 'grid',
    ...shorthands.gap('16px'),
  },
  presets: { display: 'flex', flexWrap: 'wrap', ...shorthands.gap('8px') },
  presetButton: { display: 'grid', justifyItems: 'start', textAlign: 'left', minHeight: '48px' },
  presetHint: { fontWeight: tokens.fontWeightRegular, color: tokens.colorNeutralForeground3 },
  pair: { display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'end', ...shorthands.gap('12px') },
  preview: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
  },
  submitRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', ...shorthands.gap('12px') },
  waiting: { display: 'grid', justifyItems: 'start', ...shorthands.gap('8px'), color: tokens.colorNeutralForeground2 },
  resultHead: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', ...shorthands.gap('8px', '12px') },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    ...shorthands.gap('12px'),
    fontVariantNumeric: 'tabular-nums',
  },
  resultValue: { fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold },
  danger: { color: tokens.colorPaletteRedForeground1 },
  ai: {
    display: 'grid',
    ...shorthands.gap('6px'),
    ...shorthands.padding('12px', '14px'),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    backgroundColor: tokens.colorPalettePurpleBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorPalettePurpleBorder1),
  },
  aiHead: { display: 'flex', alignItems: 'center', ...shorthands.gap('6px'), color: tokens.colorPalettePurpleForeground2 },
  placeholder: { color: tokens.colorNeutralForeground3 },
});

function validate({ userId, heartRate, steps, recordedAt }) {
  const errors = {};
  if (!userId) errors.userId = 'Pilih pasien.';
  const hr = Number(heartRate);
  if (heartRate === '' || !Number.isInteger(hr) || hr < 1 || hr > 300) errors.heartRate = 'Isi bilangan bulat 1–300.';
  const st = Number(steps);
  if (steps === '' || !Number.isInteger(st) || st < 0) errors.steps = 'Isi bilangan bulat 0 atau lebih.';
  if (!recordedAt) errors.recordedAt = 'Isi waktu pengukuran.';
  return errors;
}

function describeError(err) {
  if (err.status === 400) return { title: 'Data ditolak backend', text: err.message };
  if (err.status >= 500) return { title: 'Backend gagal memproses data', text: `${err.message}. Laporkan ke pengelola backend.` };
  return { title: 'Gagal mengirim', text: err.message };
}

export default function TestDataPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { patients, status, refresh } = useMonitoring();

  const [form, setForm] = useState({ userId: '', heartRate: '', steps: '', recordedAt: nowWibInputValue() });
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState(null);

  useEffect(() => {
    if (!form.userId && patients.length) setForm((f) => ({ ...f, userId: patients[0].id }));
  }, [patients, form.userId]);

  useEffect(() => {
    if (!sending) return;
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, [sending]);

  const errors = validate(form);
  const showError = (field) => (touched ? errors[field] : undefined);
  const update = (field) => (_, data) => setForm((f) => ({ ...f, [field]: data.value }));
  const selectedPatient = patients.find((p) => p.id === form.userId);
  const predictsAnomaly = !errors.heartRate && !errors.steps && Number(form.heartRate) > 100 && Number(form.steps) === 0;

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length) return;
    setSending(true);
    setElapsed(0);
    setFailure(null);
    try {
      const recordedAt = wibInputToIso(form.recordedAt);
      const body = await analyze({
        user_id: form.userId,
        recorded_at: recordedAt,
        heart_rate: Number(form.heartRate),
        steps: Number(form.steps),
      });
      setResult({ ...body.data, recorded_at: recordedAt, message: body.message });
      refresh();
    } catch (err) {
      setFailure(describeError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.intro}>
        <Title2 as="h1">Kirim data uji</Title2>
        <Body1 className={styles.muted}>
          Simulasikan kiriman dari aplikasi mobile ke <code>POST /api/analyze</code>. Backend menerapkan aturan anomali,
          meminta catatan dari Gemini, lalu menyimpan hasilnya.
        </Body1>
      </div>

      <MessageBar intent="warning" layout="multiline">
        <MessageBarBody>
          <MessageBarTitle>Hanya data dummy</MessageBarTitle>
          Data tersimpan di database backend production yang belum memakai autentikasi. Jangan masukkan data kesehatan
          sungguhan.
        </MessageBarBody>
      </MessageBar>

      <div className={styles.layout}>
        <form className={styles.card} onSubmit={submit} noValidate>
          <Subtitle2 as="h2">Data pengukuran</Subtitle2>

          <Field label="Pasien" required validationMessage={showError('userId')}>
            <Dropdown
              placeholder={status === 'loading' ? 'Memuat pasien…' : 'Pilih pasien'}
              value={selectedPatient ? `${selectedPatient.full_name} (${selectedPatient.email})` : ''}
              selectedOptions={form.userId ? [form.userId] : []}
              onOptionSelect={(_, d) => setForm((f) => ({ ...f, userId: d.optionValue }))}
              disabled={!patients.length}
            >
              {patients.map((p) => (
                <Option key={p.id} value={p.id} text={`${p.full_name} (${p.email})`}>
                  {p.full_name} ({p.email})
                </Option>
              ))}
            </Dropdown>
          </Field>

          <div className={styles.presets} role="group" aria-label="Isi contoh">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                className={styles.presetButton}
                onClick={() => setForm((f) => ({ ...f, heartRate: preset.heartRate, steps: preset.steps }))}
              >
                {preset.label}
                <Caption1 className={styles.presetHint}>{preset.hint}</Caption1>
              </Button>
            ))}
          </div>

          <div className={styles.pair}>
            <Field label="BPM" required validationMessage={showError('heartRate')}>
              <Input type="number" inputMode="numeric" min={1} max={300} value={form.heartRate} onChange={update('heartRate')} />
            </Field>
            <Field label="Langkah" required validationMessage={showError('steps')}>
              <Input type="number" inputMode="numeric" min={0} value={form.steps} onChange={update('steps')} />
            </Field>
          </div>

          <Field
            label="Waktu pengukuran (WIB)"
            required
            validationMessage={showError('recordedAt')}
            hint={form.recordedAt ? `Dikirim sebagai ${formatDateTime(wibInputToIso(form.recordedAt))}` : undefined}
          >
            <Input type="datetime-local" value={form.recordedAt} onChange={update('recordedAt')} />
          </Field>

          {!errors.heartRate && !errors.steps && (
            <Caption1 as="div" className={styles.preview} aria-live="polite">
              Menurut aturan prototipe, data ini akan berstatus
              <StatusBadge status={predictsAnomaly ? 'ANOMALI' : 'NORMAL'} size="small" />
            </Caption1>
          )}

          <div className={styles.submitRow}>
            <Button type="submit" appearance="primary" icon={<Send20Regular />} disabled={sending || !patients.length}>
              Kirim dan analisis
            </Button>
            {sending && (
              <Spinner size="tiny" label={`Menganalisis… ${elapsed} dtk`} labelPosition="after" />
            )}
          </div>
        </form>

        <section className={styles.card} aria-label="Hasil analisis" aria-live="polite">
          <Subtitle2 as="h2">Hasil</Subtitle2>
          {sending ? (
            <div className={styles.waiting}>
              <Spinner size="small" />
              <Text>Backend sedang meminta catatan dari Gemini. Biasanya beberapa detik, tapi bisa sampai sekitar satu menit.</Text>
            </div>
          ) : failure ? (
            <MessageBar intent="error" layout="multiline">
              <MessageBarBody>
                <MessageBarTitle>{failure.title}</MessageBarTitle>
                {failure.text}
              </MessageBarBody>
            </MessageBar>
          ) : result ? (
            <>
              <div className={styles.resultHead}>
                <StatusBadge status={result.status} size="large" />
                <Caption1 className={styles.muted}>
                  {result.message} · {formatDateTime(result.recorded_at)}
                </Caption1>
              </div>
              <div className={styles.resultGrid}>
                <div>
                  <Caption1 className={styles.muted}>Detak jantung</Caption1>
                  <div className={mergeClasses(styles.resultValue, result.is_anomaly && styles.danger)}>
                    {formatNumber(result.heart_rate)} BPM
                  </div>
                </div>
                <div>
                  <Caption1 className={styles.muted}>Langkah</Caption1>
                  <div className={styles.resultValue}>{formatNumber(result.steps)}</div>
                </div>
                <div>
                  <Caption1 className={styles.muted}>Skor (prototipe)</Caption1>
                  <div className={mergeClasses(styles.resultValue, result.is_anomaly && styles.danger)}>
                    {formatNumber(result.risk_score)}
                  </div>
                </div>
              </div>
              <div className={styles.ai}>
                <span className={styles.aiHead}>
                  <Sparkle20Filled aria-hidden />
                  <Text weight="semibold">Catatan AI</Text>
                </span>
                {result.ai_note ? <AiNoteText text={result.ai_note} /> : <Text>Tidak ada catatan AI.</Text>}
              </div>
              <Button
                appearance="secondary"
                onClick={() => navigate(`/?p=${encodeURIComponent(result.user_id)}`)}
              >
                Lihat di Aktivitas
              </Button>
            </>
          ) : (
            <Text className={styles.placeholder}>
              Hasil analisis muncul di sini setelah data dikirim: status, skor, dan catatan Gemini.
            </Text>
          )}
        </section>
      </div>

      <Disclaimer />
    </div>
  );
}
