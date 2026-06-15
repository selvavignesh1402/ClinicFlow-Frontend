import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getMyProfile, registerPatient } from '../../services/patientService';
import {
  getAppointmentsByPatient,
  getClinicians,
  cancelAppointment,
  type Clinician,
} from '../../services/appointmentService';
import type { PatientResponseDto, AppointmentResponseDto } from '../../models/types';
import {
  Users,
  CalendarDays,
  Pill,
  FlaskConical,
  FileText,
  Plus,
  User,
  MapPin,
  Heart,
  AlertCircle,
  X,
} from 'lucide-react';

export default function PatientDashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PatientResponseDto | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponseDto[]>([]);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
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
    if (isLoading) return;
    // Check for cached profile first
    try {
      const cached = localStorage.getItem('clinic_flow_patient');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.patientId) {
          setProfile(parsed);
          loadDashboardData(parsed);
          return;
        }
      }
    } catch {}
    loadDashboardData();
  }, [user, isLoading]);

  // Prefill modal fields
  useEffect(() => {
    if (showRegisterModal) {
      setRegName(user?.name || '');
      setRegEmail(user?.email || '');
      setDob(''); setGender('MALE'); setPhone('');
      setStreet(''); setCity(''); setStateCode(''); setZip('');
      setEmergencyName(''); setEmergencyPhone(''); setInsuranceId(''); setRegError('');
    }
  }, [showRegisterModal, user]);

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

  const parseContact = (contactJson: string) => {
    try { return JSON.parse(contactJson); } catch { return { email: '', phone: contactJson }; }
  };

  const parseAddress = (addressJson: string) => {
    try { return JSON.parse(addressJson); } catch { return { line1: addressJson, city: '', state: '', zip: '' }; }
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

  const loadDashboardData = async (cachedProfile?: PatientResponseDto | null) => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch clinicians
      try {
        const docs = await getClinicians();
        setClinicians(docs);
      } catch {}

      const effectiveProfile = cachedProfile || profile;
      if (effectiveProfile) {
        let appts = await getAppointmentsByPatient(effectiveProfile.patientId);
        // Enrich clinician names
        try {
          appts = appts.map(a => {
            const badName = !a.clinicianName || a.clinicianName.trim() === '' ||
              (effectiveProfile && a.clinicianName && a.clinicianName.trim().toLowerCase() === effectiveProfile.name.trim().toLowerCase()) ||
              (user?.name && a.clinicianName && a.clinicianName.trim().toLowerCase() === user.name.trim().toLowerCase());
            if (badName) {
              const found = clinicians.find(c => c.userId === a.clinicianId);
              if (found) {
                const fn = found.name?.trim().toLowerCase();
                const pn = effectiveProfile?.name?.trim().toLowerCase();
                const un = user?.name?.trim().toLowerCase();
                if (fn && fn !== pn && fn !== un) a.clinicianName = found.name;
              }
            }
            return a;
          });
        } catch {}
        // Merge cached appointment
        try {
          const cachedAppt = localStorage.getItem('clinic_flow_new_appointment');
          if (cachedAppt) {
            const a = JSON.parse(cachedAppt);
            if (a && a.patientId === effectiveProfile.patientId && !appts.find(x => x.apptId === a.apptId)) {
              appts = [a, ...appts];
              try { localStorage.removeItem('clinic_flow_new_appointment'); } catch {}
            }
          }
        } catch {}
        setAppointments(appts);
      } else {
        const patientProfile = await getMyProfile();
        if (patientProfile) {
          setProfile(patientProfile);
          let appts = await getAppointmentsByPatient(patientProfile.patientId);
          try {
            const cachedAppt = localStorage.getItem('clinic_flow_new_appointment');
            if (cachedAppt) {
              const a = JSON.parse(cachedAppt);
              if (a && a.patientId === patientProfile.patientId && !appts.find(x => x.apptId === a.apptId)) {
                appts = [a, ...appts];
                try { localStorage.removeItem('clinic_flow_new_appointment'); } catch {}
              }
            }
          } catch {}
          setAppointments(appts);
        } else {
          setProfile(null);
          setAppointments([]);
          setShowRegisterModal(true);
          toast.error('Complete your patient registry to proceed.', { id: 'registry-warn' });
        }
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
      toast.error(err?.response?.data?.message || err?.message || 'Error fetching dashboard records');
    } finally {
      setLoading(false);
    }
  };

  const createExamplePatient = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const contactInfoJson = JSON.stringify({ email: user.email || 'preethaa@example.com', phone: '+91 98765 43210' });
      const addressJson = JSON.stringify({ line1: '123 Health Ave', city: 'Chennai', state: 'TN', zip: '600001' });
      const newProfile = await registerPatient({
        name: user.name || 'Preethaa',
        dob: '2004-07-29',
        gender: 'FEMALE',
        contactInfoJson,
        addressJson,
        primaryContact: '+91 98765 43210',
        insuranceId: 'INS-104928',
        status: 'ACTIVE'
      } as any);
      toast.success('Example profile created');
      setProfile(newProfile);
      try { localStorage.setItem('clinic_flow_patient', JSON.stringify(newProfile)); } catch {}
      setShowRegisterModal(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create example patient');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelfRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionLoading(true);
    const missing: string[] = [];
    if (!regName.trim()) missing.push('Full name');
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
      const hint = "Primary contact must be a phone number (digits, +, (), -, spaces) length 7-20.";
      toast.error('Invalid phone number. ' + hint);
      setRegError('Invalid phone number. ' + hint);
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
      const contactInfoJson = JSON.stringify({ email: user.email || '', phone: normalizedPhone });
      const addressJson = JSON.stringify({ line1: street.trim(), city: city.trim(), state: stateCode.trim(), zip: zip.trim() });
      const newProfile = await registerPatient({
        name: regName.trim() || user.name,
        dob: normalizeDob(dob),
        gender: gender.toUpperCase(),
        contactInfoJson,
        addressJson,
        primaryContact: normalizedPhone,
        insuranceId: insuranceId.trim() || undefined,
        status: 'ACTIVE'
      });
      toast.success('Patient registry completed successfully!');
      setProfile(newProfile);
      try { localStorage.setItem('clinic_flow_patient', JSON.stringify(newProfile)); } catch {}
      setShowRegisterModal(false);
    } catch (err: any) {
      const resp = err?.response?.data;
      let msg = '';
      if (resp) {
        if (Array.isArray(resp.fieldErrors) && resp.fieldErrors.length > 0) {
          msg = resp.fieldErrors.map((f: any) => `${f.field || f.defaultMessage || f}: ${f.defaultMessage || f.message || JSON.stringify(f)}`).join('\n');
        } else if (Array.isArray(resp.errors) && resp.errors.length > 0) {
          msg = resp.errors.map((f: any) => (f.field ? `${f.field}: ${f.defaultMessage || f.message}` : (f.defaultMessage || f.message || JSON.stringify(f)))).join('\n');
        } else if (resp.message) {
          msg = resp.message;
        } else {
          msg = JSON.stringify(resp);
        }
      } else {
        msg = err?.message || 'Registration failed.';
      }
      try { setRegError(msg + '\n\n' + JSON.stringify(err?.response?.data, null, 2)); } catch { setRegError(msg); }
      toast.error(msg.split('\n')[0]);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAppt = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppointment(id);
      toast.success('Appointment cancelled successfully!');
      loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Cancellation failed');
    }
  };

  if (loading) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  const parsedContact = profile ? parseContact(profile.contactInfoJson) : { email: user?.email, phone: '' };
  const parsedAddress = profile ? parseAddress(profile.addressJson) : null;

  // Stats
  const upcomingCount = appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CHECKED_IN').length;

  const stats = [
    { label: 'Upcoming Appointments', value: upcomingCount.toString(), icon: <CalendarDays size={22} />, color: 'info' },
    { label: 'Prescriptions', value: '—', icon: <Pill size={22} />, color: 'success' },
    { label: 'Lab Reports', value: '—', icon: <FlaskConical size={22} />, color: 'purple' },
    { label: 'Bills', value: '—', icon: <FileText size={22} />, color: 'warning' },
  ];

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' };
  const labelStyle = { fontSize: '0.8rem' as const, color: '#94a3b8', display: 'block' as const, marginBottom: '6px' };

  return (
    <div>
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h2>Welcome back, {user?.name} 👋</h2>
          <p>Access your digital medical records and book consultations.</p>
        </div>
        {profile ? (
          <button className="btn btn-primary" onClick={() => navigate('/appointments/new')}>
            <Plus size={18} /> Book Appointment
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowRegisterModal(true)}>
            <Users size={18} /> Complete Registry Profile
          </button>
        )}
      </div>

      {/* Unregistered Alert Card */}
      {!profile && (
        <div className="card" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '32px', padding: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ color: '#ef4444', marginTop: '2px' }}><AlertCircle size={24} /></div>
            <div>
              <h4 style={{ fontWeight: 600, color: '#fca5a5', marginBottom: '6px' }}>Medical Record Not Activated</h4>
              <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '16px' }}>
                To book appointments or receive prescriptions online, the clinic requires you to submit your demographics registry profile.
              </p>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={() => setShowRegisterModal(true)}>
                Activate Clinic Profile
              </button>
              <button className="btn btn-ghost" style={{ marginLeft: '12px' }} onClick={createExamplePatient}>
                Create Example Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid (only shown when profile exists) */}
      {profile && (
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
      )}

      {/* Quick Actions */}
      {profile && (
        <div style={{ marginBottom: '32px' }}>
          <h3 className="dashboard-section-title">Quick Actions</h3>
          <div className="quick-actions">
            <div className="quick-action-card" onClick={() => navigate('/appointments/new')}>
              <div className="qa-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <CalendarDays size={24} />
              </div>
              <h4>Book Appointment</h4>
              <p>Schedule a consultation</p>
            </div>
            <div className="quick-action-card" onClick={() => navigate('/prescriptions')}>
              <div className="qa-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <Pill size={24} />
              </div>
              <h4>View Prescriptions</h4>
              <p>Your medications</p>
            </div>
            <div className="quick-action-card" onClick={() => toast('Lab reports download coming soon', { icon: '📄' })}>
              <div className="qa-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <FileText size={24} />
              </div>
              <h4>Download Reports</h4>
              <p>Lab & diagnostic reports</p>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Column Left: Profile & Appointments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Profile demographics summary */}
          {profile && (
            <div className="card">
              <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} style={{ color: 'var(--color-primary)' }} />
                  My Demographic Profile
                </h3>
                <span className="badge badge-success" style={{ textTransform: 'uppercase' }}>MRN: {profile.mrn}</span>
              </div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '24px 0 8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>DOB</label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{formatDate(profile.dob)}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Gender</label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, textTransform: 'capitalize' }}>{profile.gender.toLowerCase()}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Phone</label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{parsedContact.phone || '—'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Email</label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{parsedContact.email}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Address</label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                    {parsedAddress ? `${parsedAddress.line1}, ${parsedAddress.city}, ${parsedAddress.state} ${parsedAddress.zip}` : '—'}
                  </span>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Emergency Contact</label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.primaryContact || '—'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Insurance Policy ID</label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.insuranceId || 'Not provided'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Appointments list */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={18} style={{ color: 'var(--color-primary)' }} />
                My Scheduled Appointments
              </h3>
            </div>
            <div className="card-body" style={{ padding: '16px 0 0' }}>
              {appointments.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-state-icon" style={{ width: 48, height: 48 }}><CalendarDays size={18} /></div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No appointments booked yet.</p>
                </div>
              ) : (
                <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Department</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(appt => (
                        <tr key={appt.apptId}>
                          <td className="cell-main">{appt.clinicianName}</td>
                          <td>{appt.department}</td>
                          <td>{formatDate(appt.startAt)}</td>
                          <td>{formatTime(appt.startAt)}</td>
                          <td>{getStatusBadge(appt.status)}</td>
                          <td>
                            {(appt.status === 'SCHEDULED' || appt.status === 'CHECKED_IN') && (
                              <button
                                className="btn btn-danger"
                                style={{ padding: '4px 8px', fontSize: '0.7rem', height: 'auto', background: 'transparent', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                                onClick={() => handleCancelAppt(appt.apptId)}
                              >
                                Cancel
                              </button>
                            )}
                            {!(appt.status === 'SCHEDULED' || appt.status === 'CHECKED_IN') && (
                              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>—</span>
                            )}
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

        {/* Column Right: Clinicians Directory */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={18} style={{ color: 'var(--color-danger)' }} />
              Clinic Doctors Directory
            </h3>
          </div>
          <div className="card-body" style={{ padding: '20px 0 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {clinicians.map((doc) => (
              <div
                key={doc.userId}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', gap: '12px' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>
                  Dr
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{doc.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{doc.department}</div>
                </div>
                <div>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Available</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Patient Registry Form Modal ── */}
      {showRegisterModal && (
        <div className="modal-overlay" style={{ background: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="modal" style={{ maxWidth: '650px', background: '#0d1527', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}>
            <div className="modal-header" style={{ padding: '24px 24px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} style={{ color: 'var(--color-primary)' }} />
                Complete Patient Registry
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => { setShowRegisterModal(false); setRegError(''); }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSelfRegisterSubmit}>
              <div className="modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
                  To finalize your activation and enable scheduling, please fill in your demographics and emergency details for your clinic record.
                </p>

                {regError && (
                  <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: '#fca5a5' }}>
                    <strong>Server validation error:</strong>
                    <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#ffd6d6', whiteSpace: 'pre-wrap' }}>{regError}</div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" value={regName} onChange={e => setRegName(e.target.value)} required style={inputStyle} />
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

              <div className="modal-footer" style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {actionLoading ? 'Activating Profile...' : 'Complete Registration & Activate Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
