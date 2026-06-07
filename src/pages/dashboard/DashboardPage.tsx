import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllPatients } from '../../services/patientService';
import { getAllAppointments } from '../../services/appointmentService';
import { getAllEncounters } from '../../services/encounterService';
import { getAllPrescriptions } from '../../services/prescriptionService';
import './DashboardPage.css';
import {
  Users,
  CalendarDays,
  Stethoscope,
  Pill,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patientCount, setPatientCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [activeEncounterCount, setActiveEncounterCount] = useState(0);
  const [pendingRxCount, setPendingRxCount] = useState(0);
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [patients, appointments, encounters, prescriptions] = await Promise.all([
          getAllPatients().catch(() => []),
          getAllAppointments().catch(() => []),
          getAllEncounters().catch(() => []),
          getAllPrescriptions().catch(() => [])
        ]);

        setPatientCount(patients.length);
        setAppointmentCount(appointments.length);
        
        const active = encounters.filter(e => e.status === 'IN_PROGRESS');
        setActiveEncounterCount(active.length);

        const pending = prescriptions.filter(p => p.status === 'DRAFT');
        setPendingRxCount(pending.length);

        setAppointmentsList(appointments);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const stats = [
    { label: 'Total Patients', value: patientCount.toLocaleString(), icon: <Users size={22} />, color: 'primary', trend: '+12%', trendDir: 'up' as const },
    { label: 'Total Appointments', value: appointmentCount.toString(), icon: <CalendarDays size={22} />, color: 'info', trend: 'Active Schedule', trendDir: 'up' as const },
    { label: 'Active Encounters', value: activeEncounterCount.toString(), icon: <Stethoscope size={22} />, color: 'warning', trend: 'In Progress', trendDir: 'up' as const },
    { label: 'Pending Prescriptions', value: pendingRxCount.toString(), icon: <Pill size={22} />, color: 'success', trend: 'Drafts', trendDir: 'up' as const },
  ];

  const recentActivities = [
    { text: 'Encounter completed for Arjun Mehta', time: '5 minutes ago', color: 'var(--color-success)' },
    { text: 'New appointment scheduled — Priya Sharma', time: '15 minutes ago', color: 'var(--color-info)' },
    { text: 'Prescription issued for Ravi Kumar', time: '32 minutes ago', color: 'var(--color-primary)' },
    { text: 'Lab results received — Fatima Begum', time: '1 hour ago', color: 'var(--color-warning)' },
    { text: 'Patient registration — Suresh Patel', time: '2 hours ago', color: 'var(--color-success)' },
    { text: 'Invoice #1042 marked as paid', time: '3 hours ago', color: 'var(--color-primary)' },
  ];

  const formatTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '—';
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateTimeStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      'COMPLETED': { cls: 'badge-success', label: 'Completed' },
      'CHECKED_IN': { cls: 'badge-info', label: 'Checked In' },
      'SCHEDULED': { cls: 'badge-warning', label: 'Scheduled' },
      'CANCELLED': { cls: 'badge-danger', label: 'Cancelled' },
    };
    const s = map[status] || { cls: 'badge-neutral', label: status };
    return <span className={`badge ${s.cls}`}><span className="badge-dot"></span>{s.label}</span>;
  };

  if (loading) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Here's what's happening at the clinic today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
            <div className="stat-card-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              <div className={`stat-card-trend ${stat.trendDir}`}>
                <TrendingUp size={12} />
                {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Quick Actions</h3>
        <div className="quick-actions">
          <div className="quick-action-card" onClick={() => navigate('/encounters/new')}>
            <div className="qa-icon" style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-dark)' }}>
              <Plus size={24} />
            </div>
            <h4>New Encounter</h4>
            <p>Start a clinical visit</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/prescriptions')}>
            <div className="qa-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <Pill size={24} />
            </div>
            <h4>Write Prescription</h4>
            <p>Prescribe medication</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/encounters')}>
            <div className="qa-icon" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              <Stethoscope size={24} />
            </div>
            <h4>View Encounters</h4>
            <p>Review clinical notes</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/appointments')}>
            <div className="qa-icon" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
              <CalendarDays size={24} />
            </div>
            <h4>Appointments</h4>
            <p>Today's schedule</p>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Today's Appointments */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--color-primary)' }} />
              Today's Appointments
            </h3>
            <span className="badge badge-primary">{appointmentsList.length}</span>
          </div>
          <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointmentsList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px' }}>
                      No appointments scheduled
                    </td>
                  </tr>
                ) : (
                  appointmentsList.map((appt, i) => (
                    <tr key={i}>
                      <td className="cell-main">{appt.patientName}</td>
                      <td>{formatTime(appt.startAt)}</td>
                      <td>{appt.serviceType}</td>
                      <td>{getStatusBadge(appt.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} style={{ color: 'var(--color-warning)' }} />
              Recent Activity
            </h3>
            <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="activity-list">
            {recentActivities.map((activity, i) => (
              <div className="activity-item" key={i}>
                <div className="activity-dot" style={{ background: activity.color }} />
                <div className="activity-content">
                  <p>{activity.text}</p>
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
