import { useAuth } from '../../contexts/AuthContext';
import './DashboardPage.css';

import AdminDashboard from './AdminDashboard';
import ReceptionDashboard from './ReceptionDashboard';
import ClinicianDashboard from './ClinicianDashboard';
import PharmacistDashboard from './PharmacistDashboard';
import LabTechDashboard from './LabTechDashboard';
import FinanceDashboard from './FinanceDashboard';
import PatientDashboard from './PatientDashboard';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'RECEPTION':
      return <ReceptionDashboard />;
    case 'CLINICIAN':
      return <ClinicianDashboard />;
    case 'PHARMACIST':
      return <PharmacistDashboard />;
    case 'LAB_TECHNICIAN':
      return <LabTechDashboard />;
    case 'FINANCE_OFFICER':
      return <FinanceDashboard />;
    case 'PATIENT':
      return <PatientDashboard />;
    case 'CLINIC_MANAGER':
    case 'COMPLIANCE_OFFICER':
      return <AdminDashboard />;
    default:
      return <AdminDashboard />;
  }
}
