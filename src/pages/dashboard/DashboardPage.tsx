import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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

  const stats = [
    { label: 'Total Patients', value: '1,284', icon: <Users size={22} />, color: 'primary', trend: '+12%', trendDir: 'up' as const },
    { label: 'Today\'s Appointments', value: '18', icon: <CalendarDays size={22} />, color: 'info', trend: '3 remaining', trendDir: 'up' as const },
    { label: 'Active Encounters', value: '5', icon: <Stethoscope size={22} />, color: 'warning', trend: '2 urgent', trendDir: 'up' as const },
    { label: 'Pending Prescriptions', value: '23', icon: <Pill size={22} />, color: 'success', trend: '+8 today', trendDir: 'up' as const },
  ];

  const recentActivities = [
    { text: 'Encounter completed for Arjun Mehta', time: '5 minutes ago', color: 'var(--color-success)' },
    { text: 'New appointment scheduled — Priya Sharma', time: '15 minutes ago', color: 'var(--color-info)' },
    { text: 'Prescription issued for Ravi Kumar', time: '32 minutes ago', color: 'var(--color-primary)' },
    { text: 'Lab results received — Fatima Begum', time: '1 hour ago', color: 'var(--color-warning)' },
    { text: 'Patient registration — Suresh Patel', time: '2 hours ago', color: 'var(--color-success)' },
    { text: 'Invoice #1042 marked as paid', time: '3 hours ago', color: 'var(--color-primary)' },
  ];

  const todayAppointments = [
    { patient: 'Arjun Mehta', time: '09:00 AM', type: 'Follow-Up', status: 'COMPLETED' },
    { patient: 'Priya Sharma', time: '10:00 AM', type: 'New Visit', status: 'COMPLETED' },
    { patient: 'Ravi Kumar', time: '11:15 AM', type: 'Follow-Up', status: 'CHECKED_IN' },
    { patient: 'Fatima Begum', time: '02:00 PM', type: 'New Visit', status: 'SCHEDULED' },
    { patient: 'Suresh Patel', time: '03:30 PM', type: 'Emergency', status: 'SCHEDULED' },
  ];

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
            <span className="badge badge-primary">{todayAppointments.length}</span>
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
                {todayAppointments.map((appt, i) => (
                  <tr key={i}>
                    <td className="cell-main">{appt.patient}</td>
                    <td>{appt.time}</td>
                    <td>{appt.type}</td>
                    <td>{getStatusBadge(appt.status)}</td>
                  </tr>
                ))}
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
