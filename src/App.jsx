import { Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ActivityPage from './pages/ActivityPage';
import PatientsPage from './pages/PatientsPage';
import PatientPage from './pages/PatientPage';
import TestDataPage from './pages/TestDataPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<ActivityPage />} />
        <Route path="/pasien" element={<PatientsPage />} />
        <Route path="/pasien/:id" element={<PatientPage />} />
        <Route path="/data-uji" element={<TestDataPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
