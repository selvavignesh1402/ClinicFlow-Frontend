import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getAllPatients } from '../../services/patientService';
import { getAllAppointments } from '../../services/appointmentService';
import { getAllUsers } from '../../services/adminUserService';
import { getAllPayments } from '../../services/paymentService';
import { getAllInvoices } from '../../services/invoiceService';
import { getAllPrescriptions } from '../../services/prescriptionService';
import { getAllOrders } from '../../services/labService';
import type {
  PatientResponseDto,
  AppointmentResponseDto,
  UserResponseDto,
  PaymentResponseDto,
  InvoiceResponseDto,
  PrescriptionResponseDto,
  LabOrderResponseDto,
} from '../../models/types';
import {
  Users,
  CalendarDays,
  DollarSign,
  FileText,
  FlaskConical,
  UserPlus,
  BarChart3,
  Shield,
  Settings,
  Pill,
  CreditCard,
  Activity,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientResponseDto[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponseDto[]>([]);
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [payments, setPayments] = useState<PaymentResponseDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceResponseDto[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponseDto[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrderResponseDto[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pats, appts, usrs, pays, invs, rxs, labs] = await Promise.allSettled([
        getAllPatients(),
        getAllAppointments(),
        getAllUsers(),
        getAllPayments(),
        getAllInvoices(),
        getAllPrescriptions(),
        getAllOrders(),
      ]);
      if (pats.status === 'fulfilled') setPatients(pats.value);
      if (appts.status === 'fulfilled') setAppointments(appts.value);
      if (usrs.status === 'fulfilled') setUsers(usrs.value);
      if (pays.status === 'fulfilled') setPayments(pays.value);
      if (invs.status === 'fulfilled') setInvoices(invs.value);
      if (rxs.status === 'fulfilled') setPrescriptions(rxs.value);
      if (labs.status === 'fulfilled') setLabOrders(labs.value);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.startAt?.startsWith(todayStr));
  const staffCount = users.filter(u => u.role !== 'PATIENT').length;
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingBills = invoices.filter(i => i.status === 'ISSUED' || i.status === 'OVERDUE').length;
  const totalLabOrders = labOrders.length;

  const stats = [
    { label: 'Total Patients', value: patients.length.toString(), icon: <Users size={22} />, color: 'primary' },
    { label: 'Total Staff', value: staffCount.toString(), icon: <Shield size={22} />, color: 'purple' },
    { label: "Today's Appointments", value: todayAppts.length.toString(), icon: <CalendarDays size={22} />, color: 'info' },
    { label: 'Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: <DollarSign size={22} />, color: 'success' },
    { label: 'Pending Bills', value: pendingBills.toString(), icon: <FileText size={22} />, color: 'warning', alert: pendingBills > 0 },
    { label: 'Lab Orders', value: totalLabOrders.toString(), icon: <FlaskConical size={22} />, color: 'cyan' },
  ];

  // Recent data (sorted by createdAt descending, last 5)
  const recentPatients = [...patients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
    .slice(0, 5);

  const recentPrescriptions = [...prescriptions]
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
    .slice(0, 5);

  return (
    <div>
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h2>Admin Control Center 🏥</h2>
          <p>Good day, {user?.name?.split(' ')[0]}. Here's your system-wide overview.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
            <BarChart3 size={18} /> View Reports
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>
            <UserPlus size={18} /> Add User
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        {stats.map((stat) => (
          <div className={`stat-card ${stat.alert ? 'alert-pulse' : ''}`} key={stat.label}>
            <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-card-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h3 className="dashboard-section-title">Quick Actions</h3>
        <div className="quick-actions">
          <div className="quick-action-card" onClick={() => navigate('/admin/users')}>
            <div className="qa-icon" style={{ background: 'var(--color-primary-100, #eff6ff)', color: 'var(--color-primary-dark, #2563eb)' }}>
              <UserPlus size={24} />
            </div>
            <h4>Add User</h4>
            <p>Create staff account</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/reports')}>
            <div className="qa-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <BarChart3 size={24} />
            </div>
            <h4>View Reports</h4>
            <p>Analytics & metrics</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/admin/users')}>
            <div className="qa-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Shield size={24} />
            </div>
            <h4>Manage Roles</h4>
            <p>Role assignments</p>
          </div>
          <div className="quick-action-card" onClick={() => toast('System settings coming soon', { icon: '⚙️' })}>
            <div className="qa-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
              <Settings size={24} />
            </div>
            <h4>System Settings</h4>
            <p>Configure system</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Grid (3 columns) */}
      <div className="dashboard-grid-3">
        {/* Recently Registered Patients */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
              Recent Patients
            </h3>
            <span className="badge badge-primary">{patients.length}</span>
          </div>
          <div className="activity-list" style={{ padding: '8px 0' }}>
            {recentPatients.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No patients registered yet.</p>
              </div>
            ) : (
              recentPatients.map((p) => (
                <div className="activity-item-enhanced" key={p.patientId}>
                  <div className="activity-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                    <Users size={16} />
                  </div>
                  <div className="activity-detail">
                    <div className="activity-title">{p.name}</div>
                    <div className="activity-meta">MRN: {p.mrn} · {timeAgo(p.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Payments */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <CreditCard size={18} style={{ color: 'var(--color-success)' }} />
              Latest Payments
            </h3>
            <span className="badge badge-success">{payments.length}</span>
          </div>
          <div className="activity-list" style={{ padding: '8px 0' }}>
            {recentPayments.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No payments recorded yet.</p>
              </div>
            ) : (
              recentPayments.map((p) => (
                <div className="activity-item-enhanced" key={p.paymentId}>
                  <div className="activity-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                    <DollarSign size={16} />
                  </div>
                  <div className="activity-detail">
                    <div className="activity-title">₹{p.amount.toLocaleString('en-IN')}</div>
                    <div className="activity-meta">{p.patientName} · {p.method} · {timeAgo(p.paidAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Prescriptions */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <Pill size={18} style={{ color: 'var(--color-warning)' }} />
              Latest Prescriptions
            </h3>
            <span className="badge badge-warning">{prescriptions.length}</span>
          </div>
          <div className="activity-list" style={{ padding: '8px 0' }}>
            {recentPrescriptions.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No prescriptions issued yet.</p>
              </div>
            ) : (
              recentPrescriptions.map((rx) => (
                <div className="activity-item-enhanced" key={rx.rxId}>
                  <div className="activity-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                    <Pill size={16} />
                  </div>
                  <div className="activity-detail">
                    <div className="activity-title">{rx.medicationName}</div>
                    <div className="activity-meta">
                      {rx.patientName} · Dr. {rx.clinicianName} · {timeAgo(rx.issuedAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
