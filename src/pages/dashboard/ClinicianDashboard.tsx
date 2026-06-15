import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getAllEncounters } from '../../services/encounterService';
import { getAllPrescriptions } from '../../services/prescriptionService';
import { getAllOrders } from '../../services/labService';
import type {
  EncounterResponseDto,
  PrescriptionResponseDto,
  LabOrderResponseDto,
} from '../../models/types';
import {
  Stethoscope,
  Users,
  Clock,
  Pill,
  FlaskConical,
  Plus,
  Search,
  FileText,
} from 'lucide-react';

export default function ClinicianDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [encounters, setEncounters] = useState<EncounterResponseDto[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponseDto[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrderResponseDto[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [encs, rxs, labs] = await Promise.allSettled([
        getAllEncounters(),
        getAllPrescriptions(),
        getAllOrders(),
      ]);
      if (encs.status === 'fulfilled') setEncounters(encs.value);
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

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      'IN_PROGRESS': { cls: 'badge-warning', label: 'In Progress' },
      'COMPLETED': { cls: 'badge-success', label: 'Completed' },
      'CANCELLED': { cls: 'badge-danger', label: 'Cancelled' },
    };
    const s = map[status] || { cls: 'badge-neutral', label: status };
    return <span className={`badge ${s.cls}`}><span className="badge-dot"></span>{s.label}</span>;
  };

  if (loading) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEncounters = encounters.filter(e => e.startAt?.startsWith(todayStr));
  const patientsSeen = todayEncounters.filter(e => e.status === 'COMPLETED').length;
  const pendingEncounters = encounters.filter(e => e.status === 'IN_PROGRESS').length;
  const pendingPrescriptions = prescriptions.filter(rx => rx.status === 'DRAFT' || rx.status === 'ISSUED').length;
  const labOrdersRequested = labOrders.filter(l => l.status === 'ORDERED').length;

  const stats = [
    { label: "Today's Encounters", value: todayEncounters.length.toString(), icon: <Stethoscope size={22} />, color: 'primary' },
    { label: 'Patients Seen', value: patientsSeen.toString(), icon: <Users size={22} />, color: 'success' },
    { label: 'Pending Encounters', value: pendingEncounters.toString(), icon: <Clock size={22} />, color: 'warning', alert: pendingEncounters > 0 },
    { label: 'Pending Prescriptions', value: pendingPrescriptions.toString(), icon: <Pill size={22} />, color: 'amber' },
    { label: 'Lab Orders Requested', value: labOrdersRequested.toString(), icon: <FlaskConical size={22} />, color: 'cyan' },
  ];

  // Today's patients from encounters
  const todayPatients = todayEncounters.slice(0, 10);

  // Recent encounters (sorted by startAt descending, last 10)
  const recentEncounters = [...encounters]
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    .slice(0, 10);

  return (
    <div>
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h2>Clinician Workstation 🩺</h2>
          <p>Good day, Dr. {user?.name?.split(' ').slice(-1)[0]}. Manage your clinical encounters and prescriptions.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/encounters/new')}>
            <Plus size={18} /> New Encounter
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
          <div className="quick-action-card" onClick={() => navigate('/encounters/new')}>
            <div className="qa-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Plus size={24} />
            </div>
            <h4>New Encounter</h4>
            <p>Start a clinical visit</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/patients')}>
            <div className="qa-icon" style={{ background: '#f0fdfa', color: '#0d9488' }}>
              <Search size={24} />
            </div>
            <h4>Search Patient</h4>
            <p>Find patient records</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/prescriptions')}>
            <div className="qa-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Pill size={24} />
            </div>
            <h4>View Prescriptions</h4>
            <p>Manage medications</p>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="dashboard-grid">
        {/* Today's Patients */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
              Today's Patients
            </h3>
            <span className="badge badge-primary">{todayEncounters.length}</span>
          </div>
          <div className="card-body" style={{ padding: '16px 0 0' }}>
            {todayPatients.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No encounters today.</p>
              </div>
            ) : (
              <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Chief Complaint</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayPatients.map((enc) => (
                      <tr key={enc.encounterId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/encounters/${enc.encounterId}`)}>
                        <td className="cell-main">{enc.patientName}</td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            {enc.chiefComplaint ? (enc.chiefComplaint.length > 40 ? enc.chiefComplaint.slice(0, 40) + '…' : enc.chiefComplaint) : '—'}
                          </span>
                        </td>
                        <td>{getStatusBadge(enc.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Encounters */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--color-warning)' }} />
              Recent Encounters
            </h3>
            <span className="badge badge-warning">{encounters.length}</span>
          </div>
          <div className="card-body" style={{ padding: '16px 0 0' }}>
            {recentEncounters.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No encounters recorded yet.</p>
              </div>
            ) : (
              <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Encounter ID</th>
                      <th>Patient</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEncounters.map((enc) => (
                      <tr key={enc.encounterId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/encounters/${enc.encounterId}`)}>
                        <td>
                          <span className="badge badge-neutral" style={{ padding: '4px 8px', fontWeight: 600 }}>
                            #{enc.encounterId}
                          </span>
                        </td>
                        <td className="cell-main">{enc.patientName}</td>
                        <td>{formatDate(enc.startAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
