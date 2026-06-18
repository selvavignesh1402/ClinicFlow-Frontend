import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
        <Route path="/profile" element={<ProfilePage />} />

        {/* Encounters */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CLINICIAN', 'PATIENT']}><Outlet /></ProtectedRoute>}>
          <Route path="/encounters" element={<EncounterListPage />} />
          <Route path="/encounters/:id" element={<EncounterDetailPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CLINICIAN']}><Outlet /></ProtectedRoute>}>
          <Route path="/encounters/new" element={<EncounterFormPage />} />
          <Route path="/encounters/:id/edit" element={<EncounterFormPage />} />
        </Route>

        {/* Prescriptions */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CLINICIAN', 'PATIENT']}><Outlet /></ProtectedRoute>}>
          <Route path="/prescriptions" element={<PrescriptionListPage />} />
          <Route path="/prescriptions/:id" element={<PrescriptionDetailPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CLINICIAN']}><Outlet /></ProtectedRoute>}>
          <Route path="/prescriptions/new" element={<PrescriptionFormPage />} />
          <Route path="/prescriptions/:id/edit" element={<PrescriptionFormPage />} />
        </Route>

        {/* Patients Registry */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CLINICIAN', 'RECEPTION', 'CLINIC_MANAGER']}><Outlet /></ProtectedRoute>}>
          <Route path="/patients" element={<PatientListPage />} />
        </Route>
        
        {/* Appointments */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CLINICIAN', 'RECEPTION', 'CLINIC_MANAGER', 'PATIENT']}><Outlet /></ProtectedRoute>}>
          <Route path="/appointments" element={<AppointmentListPage />} />
          <Route path="/appointments/new" element={<AppointmentFormPage />} />
        </Route>

        {/* Lab Module */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CLINICIAN', 'LAB_TECHNICIAN']}><Outlet /></ProtectedRoute>}>
          <Route path="/lab" element={<LabDashboardPage />} />
          <Route path="/lab/new" element={<LabOrderFormPage />} />
          <Route path="/lab/:id" element={<LabOrderDetailPage />} />
        </Route>

        {/* Pharmacy & Dispensing */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'CLINICIAN']}><Outlet /></ProtectedRoute>}>
          <Route path="/pharmacy" element={<PharmacyPage />} />
        </Route>

        {/* Inventory */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'CLINIC_MANAGER']}><Outlet /></ProtectedRoute>}>
          <Route path="/inventory" element={<InventoryPage />} />
        </Route>

        {/* Invoices */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'FINANCE_OFFICER', 'CLINIC_MANAGER', 'RECEPTION']}><Outlet /></ProtectedRoute>}>
          <Route path="/invoices" element={<InvoicePage />} />
        </Route>

        {/* Payments */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'FINANCE_OFFICER', 'CLINIC_MANAGER']}><Outlet /></ProtectedRoute>}>
          <Route path="/payments" element={<PaymentPage />} />
        </Route>

        {/* Reports */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CLINIC_MANAGER', 'FINANCE_OFFICER']}><Outlet /></ProtectedRoute>}>
          <Route path="/reports" element={<ReportPage />} />
        </Route>

        {/* Admin User Management */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']}><Outlet /></ProtectedRoute>}>
          <Route path="/admin/users" element={<AdminUserManagementPage />} />
        </Route>
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

/*
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
*/
