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

// Appointments
import AppointmentListPage from '../pages/appointments/AppointmentListPage';
import AppointmentFormPage from '../pages/appointments/AppointmentFormPage';

// Patients
import PatientListPage from '../pages/patients/PatientListPage';

// Lab Module
import LabDashboardPage from '../pages/lab/LabDashboradPage';
import LabOrderFormPage from '../pages/lab/LabOrderFormPage';
import LabOrderDetailPage from '../pages/lab/LabOrderDetailPage';

// Admin
import AdminUserManagementPage from '../pages/admin/AdminUserManagementPage';

// Profile
import ProfilePage from '../pages/profile/ProfilePage';

// Finance
import InvoicePage from '../pages/invoices/InvoicePage';
import PaymentPage from '../pages/payments/PaymentPage';
import ReportPage from '../pages/reports/ReportPage';

// Pharmacy & Inventory
import PharmacyPage from '../pages/pharmacy/PharmacyPage';
import InventoryPage from '../pages/inventory/InventoryPage';

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

        {/* Patients Registry */}
        <Route path="/patients" element={<PatientListPage />} />
        
        {/* Appointments */}
        <Route path="/appointments" element={<AppointmentListPage />} />
        <Route path="/appointments/new" element={<AppointmentFormPage />} />

        {/* Lab Module */}
        <Route path="/lab" element={<LabDashboardPage />} />
        <Route path="/lab/new" element={<LabOrderFormPage />} />
        <Route path="/lab/:id" element={<LabOrderDetailPage />} />

        <Route path="/pharmacy" element={<PharmacyPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/invoices" element={<InvoicePage />} />
        <Route path="/payments" element={<PaymentPage />} />
        <Route path="/reports" element={<ReportPage />} />
        <Route path="/admin/users" element={<AdminUserManagementPage />} />
        <Route path="/profile" element={<ProfilePage />} />
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
