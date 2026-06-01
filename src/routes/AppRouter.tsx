import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/guards/ProtectedRoute';

// Auth
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Dashboard
import DashboardPage from '../pages/dashboard/DashboardPage';

// Encounters
import EncounterListPage from '../pages/encounters/EncounterListPage';
import EncounterDetailPage from '../pages/encounters/EncounterDetailPage';
import EncounterFormPage from '../pages/encounters/EncounterFormPage';

// Prescriptions
import PrescriptionListPage from '../pages/prescriptions/PrescriptionListPage';
import PrescriptionDetailPage from '../pages/prescriptions/PrescriptionDetailPage';
import PrescriptionFormPage from '../pages/prescriptions/PrescriptionFormPage';

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected (inside MainLayout) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Encounters */}
        <Route path="/encounters" element={<EncounterListPage />} />
        <Route path="/encounters/new" element={<EncounterFormPage />} />
        <Route path="/encounters/:id" element={<EncounterDetailPage />} />
        <Route path="/encounters/:id/edit" element={<EncounterFormPage />} />

        {/* Prescriptions */}
        <Route path="/prescriptions" element={<PrescriptionListPage />} />
        <Route path="/prescriptions/new" element={<PrescriptionFormPage />} />
        <Route path="/prescriptions/:id" element={<PrescriptionDetailPage />} />
        <Route path="/prescriptions/:id/edit" element={<PrescriptionFormPage />} />

        {/* Placeholder routes for future modules */}
        <Route path="/patients" element={<ComingSoon title="Patients" />} />
        <Route path="/appointments" element={<ComingSoon title="Appointments" />} />
        <Route path="/lab" element={<ComingSoon title="Lab Orders" />} />
        <Route path="/pharmacy" element={<ComingSoon title="Pharmacy" />} />
        <Route path="/inventory" element={<ComingSoon title="Inventory" />} />
        <Route path="/invoices" element={<ComingSoon title="Invoices" />} />
        <Route path="/payments" element={<ComingSoon title="Payments" />} />
        <Route path="/reports" element={<ComingSoon title="Reports" />} />
        <Route path="/admin/users" element={<ComingSoon title="User Management" />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Temporary placeholder for future modules
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="empty-state" style={{ marginTop: '80px' }}>
      <div className="empty-state-icon" style={{ width: 80, height: 80, fontSize: '2rem' }}>🚧</div>
      <h3>{title}</h3>
      <p>This module is coming soon. Stay tuned!</p>
    </div>
  );
}
