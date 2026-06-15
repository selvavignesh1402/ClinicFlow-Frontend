import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getAllPatients, registerPatient } from '../../services/patientService';
import { getAllAppointments, checkInAppointment, cancelAppointment } from '../../services/appointmentService';
import type { PatientResponseDto, AppointmentResponseDto } from '../../models/types';
import {
  Users,
  CalendarDays,
  Activity,
  Clock,
  Plus,
  Calendar,
  Search,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';

export default function ReceptionDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patientsList, setPatientsList] = useState<PatientResponseDto[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponseDto[]>([]);

  // Search & Filter
  const [patientSearch, setPatientSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');

  // Register Patient Modal
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('MALE');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zip, setZip] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [insuranceId, setInsuranceId] = useState('');
  const [regError, setRegError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showAddPatientModal) {
      setRegName(''); setRegEmail(''); setDob(''); setGender('MALE'); setPhone('');
      setStreet(''); setCity(''); setStateCode(''); setZip('');
      setEmergencyName(''); setEmergencyPhone(''); setInsuranceId(''); setRegError('');
    }
  }, [showAddPatientModal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pats, appts] = await Promise.all([getAllPatients(), getAllAppointments()]);
      setPatientsList(pats);
      setAppointments(appts);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const normalizeDob = (d: string) => {
    if (!d) return d;
    const ddmmyyyy = /^([0-3]?\d)-([0-1]?\d)-(\d{4})$/;
    const m = d.match(ddmmyyyy);
    if (m) {
      const [, dd, mm, yyyy] = m;
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    return d;
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      'SCHEDULED': { cls: 'badge-warning', label: 'Scheduled' },
      'CHECKED_IN': { cls: 'badge-info', label: 'Checked In' },
      'COMPLETED': { cls: 'badge-success', label: 'Completed' },
      'CANCELLED': { cls: 'badge-danger', label: 'Cancelled' },
      'NO_SHOW': { cls: 'badge-neutral', label: 'No Show' },
    };
    const s = map[status] || { cls: 'badge-neutral', label: status };
    return <span className={`badge ${s.cls}`}><span className="badge-dot"></span>{s.label}</span>;
  };

  const parseContact = (contactJson: string) => {
    try { return JSON.parse(contactJson); } catch { return { email: '', phone: contactJson }; }
  };

  // Actions
  const handleCheckIn = async (id: number) => {
    try {
      await checkInAppointment(id);
      toast.success('Patient checked in successfully!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed');
    }
  };

  const handleCancelAppt = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppointment(id);
      toast.success('Appointment cancelled successfully!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Cancellation failed');
    }
  };

  const handleReceptionistRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const missing: string[] = [];
    if (!regName.trim()) missing.push('Full name');
    if (!regEmail.trim()) missing.push('Email');
    if (!dob) missing.push('Date of birth');
    if (!phone.trim()) missing.push('Phone number');
    if (!street.trim()) missing.push('Street address');
    if (!city.trim()) missing.push('City');
    if (!stateCode.trim()) missing.push('State');
    if (!zip.trim()) missing.push('Zip');
    if (!emergencyName.trim()) missing.push('Emergency contact name');
    if (!emergencyPhone.trim()) missing.push('Emergency contact phone');

    if (missing.length > 0) {
      toast.error(`Missing required fields: ${missing.join(', ')}`);
      setActionLoading(false);
      return;
    }

    const phonePattern = /^[0-9+()\-\s]{7,20}$/;
    const normalizedPhone = phone.trim().replace(/\s+/g, ' ');
    const normalizedEmergency = emergencyPhone.trim().replace(/\s+/g, ' ');
    if (!phonePattern.test(normalizedPhone)) {
      toast.error('Invalid phone number. Must be 7-20 characters (digits, +, (), -, spaces).');
      setRegError('Invalid phone number.');
      setActionLoading(false);
      return;
    }
    if (!phonePattern.test(normalizedEmergency)) {
      toast.error('Invalid emergency contact phone.');
      setRegError('Invalid emergency contact phone.');
      setActionLoading(false);
      return;
    }
    try {
      const contactInfoJson = JSON.stringify({ email: regEmail.trim(), phone: normalizedPhone });
      const addressJson = JSON.stringify({ line1: street.trim(), city: city.trim(), state: stateCode.trim(), zip: zip.trim() });
      await registerPatient({
        name: regName.trim(),
        dob: normalizeDob(dob),
        gender: gender.toUpperCase(),
        contactInfoJson,
        addressJson,
        primaryContact: normalizedPhone,
        insuranceId: insuranceId.trim() || undefined,
        status: 'ACTIVE'
      });
      toast.success('Patient registered successfully!');
      setShowAddPatientModal(false);
      loadData();
    } catch (err: any) {
      const resp = err?.response?.data;
      let raw = err?.message || 'Failed to register patient';
      try { raw = JSON.stringify(resp, null, 2) || raw; } catch {}
      setRegError(raw);
      toast.error(err?.message || 'Failed to register patient');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.startAt?.startsWith(todayStr));
  const checkedInCount = todayAppts.filter(a => a.status === 'CHECKED_IN').length;
  const todayPatients = patientsList.filter(p => p.createdAt?.startsWith(todayStr)).length;
  const walkInCount = todayAppts.filter(a => a.serviceType?.toLowerCase().includes('walk')).length;
  const pendingCount = appointments.filter(a => a.status === 'SCHEDULED').length;

  const stats = [
    { label: "Today's Appointments", value: todayAppts.length.toString(), icon: <CalendarDays size={22} />, color: 'info' },
    { label: 'Checked-In Patients', value: checkedInCount.toString(), icon: <UserCheck size={22} />, color: 'success' },
    { label: 'New Registrations', value: todayPatients.toString(), icon: <UserPlus size={22} />, color: 'primary' },
    { label: 'Walk-In Patients', value: walkInCount.toString(), icon: <Activity size={22} />, color: 'purple' },
    { label: 'Pending Appointments', value: pendingCount.toString(), icon: <Clock size={22} />, color: 'warning' },
  ];

  const filteredPatients = patientsList.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.mrn.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const upcomingAppts = appointments.filter(appt => {
    const matchSearch =
      appt.patientName.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      appt.clinicianName.toLowerCase().includes(appointmentSearch.toLowerCase());
    const isUpcoming = appt.status === 'SCHEDULED' || appt.status === 'CHECKED_IN';
    return matchSearch && isUpcoming;
  }).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' };
  const labelStyle = { fontSize: '0.8rem' as const, color: '#94a3b8', display: 'block' as const, marginBottom: '6px' };

  return (
    <div>
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h2>Reception Desk 🏢</h2>
          <p>Register clinic patients and manage doctor appointments.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowAddPatientModal(true)}>
            <Plus size={18} /> Register Patient
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/appointments/new')}>
            <Calendar size={18} style={{ marginRight: '6px' }} /> Book Appointment
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
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
          <div className="quick-action-card" onClick={() => setShowAddPatientModal(true)}>
            <div className="qa-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <UserPlus size={24} />
            </div>
            <h4>Register Patient</h4>
            <p>New patient registration</p>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/appointments/new')}>
            <div className="qa-icon" style={{ background: '#f0fdfa', color: '#0d9488' }}>
              <CalendarDays size={24} />
            </div>
            <h4>Book Appointment</h4>
            <p>Schedule a visit</p>
          </div>
          <div className="quick-action-card" onClick={() => toast('Select a patient from the appointments table and click Check In', { icon: '✅' })}>
            <div className="qa-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <UserCheck size={24} />
            </div>
            <h4>Check-In Patient</h4>
            <p>Mark patient arrival</p>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="dashboard-grid">
        {/* Patient Registry */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
              Patient Registry
            </h3>
            <div className="header-search search-input" style={{ width: '220px', margin: 0 }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search name or MRN..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="card-body" style={{ padding: '16px 0 0' }}>
            {filteredPatients.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <p style={{ color: 'var(--color-text-secondary)' }}>No registered patients found.</p>
              </div>
            ) : (
              <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>MRN</th>
                      <th>Name</th>
                      <th>DOB</th>
                      <th>Gender</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.slice(0, 10).map(p => {
                      const contact = parseContact(p.contactInfoJson);
                      return (
                        <tr key={p.patientId}>
                          <td><span className="badge badge-neutral" style={{ padding: '4px 6px', fontWeight: 600 }}>{p.mrn}</span></td>
                          <td className="cell-main">{p.name}</td>
                          <td>{formatDate(p.dob)}</td>
                          <td style={{ textTransform: 'capitalize' }}>{p.gender.toLowerCase()}</td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>{contact.phone}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{contact.email}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--color-warning)' }} />
              Upcoming Appointments
            </h3>
            <div className="header-search search-input" style={{ width: '200px', margin: 0 }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Filter by patient/doctor..."
                value={appointmentSearch}
                onChange={e => setAppointmentSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="card-body" style={{ padding: '16px 0 0' }}>
            {upcomingAppts.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <p style={{ color: 'var(--color-text-secondary)' }}>No upcoming appointments.</p>
              </div>
            ) : (
              <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppts.slice(0, 10).map(appt => (
                      <tr key={appt.apptId}>
                        <td>{formatTime(appt.startAt)}</td>
                        <td>
                          <div className="cell-main">{appt.patientName}</div>
                          <div className="cell-sub" style={{ fontSize: '0.7rem' }}>MRN: {appt.patientMrn}</div>
                        </td>
                        <td>{appt.clinicianName}</td>
                        <td>{getStatusBadge(appt.status)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {appt.status === 'SCHEDULED' && (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '4px 6px', fontSize: '0.7rem', height: 'auto' }}
                                onClick={() => handleCheckIn(appt.apptId)}
                              >
                                Check In
                              </button>
                            )}
                            {(appt.status === 'SCHEDULED' || appt.status === 'CHECKED_IN') && (
                              <button
                                className="btn btn-danger"
                                style={{ padding: '4px 6px', fontSize: '0.7rem', height: 'auto', background: 'transparent', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                                onClick={() => handleCancelAppt(appt.apptId)}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Patient Registry Modal (Receptionist) ── */}
      {showAddPatientModal && (
        <div className="modal-overlay" style={{ background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="modal" style={{ maxWidth: '650px', background: '#0d1527', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}>
            <div className="modal-header" style={{ padding: '24px 24px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} style={{ color: 'var(--color-primary)' }} />
                Register New Clinic Patient
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddPatientModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleReceptionistRegisterSubmit}>
              <div className="modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                {regError && (
                  <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: '#fca5a5' }}>
                    <strong>Error:</strong>
                    <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#ffd6d6', whiteSpace: 'pre-wrap' }}>{regError}</div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Patient Full Name *</label>
                  <input type="text" placeholder="Enter patient full name" value={regName} onChange={e => setRegName(e.target.value)} required style={inputStyle} />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Patient Email *</label>
                  <input type="email" placeholder="patient@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={labelStyle}>Date of Birth *</label>
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} required style={inputStyle} />
                  </div>
                  <div className="form-group">
                    <label style={labelStyle}>Gender *</label>
                    <select value={gender} onChange={e => setGender(e.target.value)} required style={{ ...inputStyle, background: '#0d1527' }}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Phone Number *</label>
                  <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} />
                </div>

                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Address Details</h3>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Street Address *</label>
                  <input type="text" placeholder="123 Health Ave" value={street} onChange={e => setStreet(e.target.value)} required style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={labelStyle}>City *</label>
                    <input type="text" placeholder="Chennai" value={city} onChange={e => setCity(e.target.value)} required style={inputStyle} />
                  </div>
                  <div className="form-group">
                    <label style={labelStyle}>State *</label>
                    <input type="text" placeholder="TN" value={stateCode} onChange={e => setStateCode(e.target.value)} required style={inputStyle} />
                  </div>
                  <div className="form-group">
                    <label style={labelStyle}>Zip *</label>
                    <input type="text" placeholder="600001" value={zip} onChange={e => setZip(e.target.value)} required style={inputStyle} />
                  </div>
                </div>

                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Emergency Contact</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label style={labelStyle}>Contact Name *</label>
                    <input type="text" placeholder="Jane Doe (Spouse)" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} required style={inputStyle} />
                  </div>
                  <div className="form-group">
                    <label style={labelStyle}>Contact Phone *</label>
                    <input type="tel" placeholder="+91 98765 00000" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} required style={inputStyle} />
                  </div>
                </div>

                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Insurance Details (Optional)</h3>

                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={labelStyle}>Insurance Policy ID</label>
                  <input type="text" placeholder="INS-104928" value={insuranceId} onChange={e => setInsuranceId(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddPatientModal(false)}>Cancel</button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ flex: 2, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {actionLoading ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
