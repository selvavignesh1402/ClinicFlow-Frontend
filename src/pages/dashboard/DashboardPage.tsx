import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './DashboardPage.css';
import { getMyProfile, registerPatient, getAllPatients } from '../../services/patientService';
import { 
  getAllAppointments, 
  getAppointmentsByPatient, 
  checkInAppointment, 
  cancelAppointment, 
  getClinicians, 
  type Clinician 
} from '../../services/appointmentService';
import type { PatientResponseDto, AppointmentResponseDto } from '../../models/types';
import { toast } from 'react-hot-toast';
import {
  Users,
  CalendarDays,
  Stethoscope,
  Pill,
  Clock,
  AlertCircle,
  Plus,
  User,
  MapPin,
  Search,
  Heart,
  Calendar,
  X,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // ── Global State ──
  const [profile, setProfile] = useState<PatientResponseDto | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponseDto[]>([]);
  const [patientsList, setPatientsList] = useState<PatientResponseDto[]>([]);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Search & Filter State ──
  const [patientSearch, setPatientSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');

  // ── Modals State ──
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Form State (For Patient Registry / Add Patient) ──
  const [regName, setRegName] = useState(''); // Used by receptionist
  const [regEmail, setRegEmail] = useState(''); // Used by receptionist
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
    if (isLoading) return; // wait for auth restoration
    // Seed profile from cached registration (if available) to avoid re-opening the modal
    try {
      const cached = localStorage.getItem('clinic_flow_patient');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.patientId) {
          // set immediately and call loader with cached profile to avoid race
          setProfile(parsed);
          loadDashboardData(parsed);
          return;
        }
      }
    } catch {}

    loadDashboardData();
  }, [user, isLoading]);

  // Helpers
  const normalizeDob = (d: string) => {
    if (!d) return d;
    // convert DD-MM-YYYY to YYYY-MM-DD
    const ddmmyyyy = /^([0-3]?\d)-([0-1]?\d)-(\d{4})$/;
    const m = d.match(ddmmyyyy);
    if (m) {
      const [, dd, mm, yyyy] = m;
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    // assume already YYYY-MM-DD
    return d;
  };

  // Initialize editable name when patient modal opens
  useEffect(() => {
    if (showRegisterModal && user && user.role === 'PATIENT') {
      setRegName(user.name || '');
    }
  }, [showRegisterModal, user]);

  // Prefill and reset fields when modals open/close
  useEffect(() => {
    if (showRegisterModal) {
      setRegName(user?.name || '');
      setRegEmail(user?.email || '');
      setDob('');
      setGender('MALE');
      setPhone('');
      setStreet('');
      setCity('');
      setStateCode('');
      setZip('');
      setEmergencyName('');
      setEmergencyPhone('');
      setInsuranceId('');
      setRegError('');
    } else {
      setRegError('');
    }
  }, [showRegisterModal, user]);

  useEffect(() => {
    if (showAddPatientModal) {
      setRegName('');
      setRegEmail('');
      setDob('');
      setGender('MALE');
      setPhone('');
      setStreet('');
      setCity('');
      setStateCode('');
      setZip('');
      setEmergencyName('');
      setEmergencyPhone('');
      setInsuranceId('');
      setRegError('');
    }
  }, [showAddPatientModal]);

  const loadDashboardData = async (cachedProfile?: PatientResponseDto | null) => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'PATIENT') {
        const effectiveProfile = cachedProfile || profile;
        // Ensure we have clinicians locally to map clinician names
        try {
          if (clinicians.length === 0) {
            const docs = await getClinicians();
            setClinicians(docs);
          }
        } catch {}
        // If we already have the profile (or cached one), avoid re-fetching
        if (effectiveProfile) {
          let appts = await getAppointmentsByPatient(effectiveProfile.patientId);
          // Enrich clinician names from local clinician list when possible
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
          try {
            const cachedAppt = localStorage.getItem('clinic_flow_new_appointment');
            if (cachedAppt) {
              const a = JSON.parse(cachedAppt);
              if (a && a.patientId === effectiveProfile.patientId && !appts.find(x => x.apptId === a.apptId)) {
                appts = [a, ...appts];
                // clear cached appointment after merging to avoid duplicates next load
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
        const docs = await getClinicians();
        setClinicians(docs);
      } else if (user.role === 'RECEPTION') {
        const patients = await getAllPatients();
        setPatientsList(patients);
        const appts = await getAllAppointments();
        setAppointments(appts);
      } else {
        // Clinicians / Admin / Other
        const appts = await getAllAppointments();
        setAppointments(appts);
        const patients = await getAllPatients();
        setPatientsList(patients);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
      const serverMsg = err?.response?.data?.message || err?.message;
      toast.error(serverMsg || 'Error fetching dashboard records');
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
      const req = {
        name: user.name || 'Preethaa',
        dob: '2004-07-29',
        gender: 'FEMALE',
        contactInfoJson,
        addressJson,
        primaryContact: '+91 98765 43210',
        insuranceId: 'INS-104928',
        status: 'ACTIVE'
      } as const;
      const newProfile = await registerPatient(req as any);
      toast.success('Example profile created');
      setProfile(newProfile);
      try { localStorage.setItem('clinic_flow_patient', JSON.stringify(newProfile)); } catch {}
      setShowRegisterModal(false);
      // Don't re-run the full dashboard load here — keep the newly returned profile
      // to avoid triggering auth-based fetches that may re-open the modal.
    } catch (err: any) {
      console.error('Create example patient failed', err);
      toast.error(err?.message || 'Failed to create example patient');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Actions ──
  const handleSelfRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionLoading(true);
    // Client-side validation
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

    // Phone format must match backend: digits, +, (), - and spaces; length 7-20
    const phonePattern = /^[0-9+()\-\s]{7,20}$/;
    const normalizedPhone = phone.trim().replace(/\s+/g, ' ');
    const normalizedEmergency = emergencyPhone.trim().replace(/\s+/g, ' ');
    if (!phonePattern.test(normalizedPhone)) {
      const hint = "Primary contact must be a phone number (digits, +, (), -, spaces) length 7-20. e.g. +91 98765 43210";
      toast.error('Invalid phone number. ' + hint);
      setRegError('Invalid phone number. ' + hint);
      setActionLoading(false);
      return;
    }
    if (!phonePattern.test(normalizedEmergency)) {
      const hint = "Emergency contact must be a phone number (digits, +, (), -, spaces) length 7-20.";
      toast.error('Invalid emergency contact phone. ' + hint);
      setRegError('Invalid emergency contact phone. ' + hint);
      setActionLoading(false);
      return;
    }
    try {
      const contactInfoJson = JSON.stringify({ email: user.email || '', phone: normalizedPhone });
      const addressJson = JSON.stringify({ line1: street.trim(), city: city.trim(), state: stateCode.trim(), zip: zip.trim() });
      const primaryContact = normalizedPhone;
      const dobIso = normalizeDob(dob);
      const genderValue = (gender || '').toString().toUpperCase();

      const newProfile = await registerPatient({
        name: regName.trim() || user.name,
        dob: dobIso,
        gender: genderValue,
        contactInfoJson,
        addressJson,
        primaryContact,
        insuranceId: insuranceId.trim() || undefined,
        status: 'ACTIVE'
      });

      toast.success('Patient registry completed successfully!');
      setProfile(newProfile);
      try { localStorage.setItem('clinic_flow_patient', JSON.stringify(newProfile)); } catch {}
      setShowRegisterModal(false);
      // Keep the returned profile in state and avoid reloading dashboard immediately.
      // This prevents the registration modal from reappearing if the auth token
      // hasn't changed immediately on the backend.
    } catch (err: any) {
      const resp = err?.response?.data;
      let msg = '';
      if (resp) {
        if (Array.isArray(resp.fieldErrors) && resp.fieldErrors.length > 0) {
          msg = resp.fieldErrors.map((f: any) => `${f.field || f.defaultMessage || f}: ${f.defaultMessage || f.message || JSON.stringify(f)}`).join('\n');
        } else if (Array.isArray(resp.errors) && resp.errors.length > 0) {
          msg = resp.errors.map((f: any) => (f.field ? `${f.field}: ${f.defaultMessage || f.message}` : (f.defaultMessage || f.message || JSON.stringify(f)) )).join('\n');
        } else if (resp.message) {
          msg = resp.message;
        } else {
          msg = JSON.stringify(resp);
        }
      } else {
        msg = err?.message || 'Registration failed.';
      }
      // also include raw response for debugging
      try {
        setRegError(msg + '\n\n' + JSON.stringify(err?.response?.data, null, 2));
      } catch {
        setRegError(msg);
      }
      console.error('Self registration failed', err);
      toast.error(msg.split('\n')[0]);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceptionistRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    // Client-side validation for receptionist form
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
      const hint = "Primary contact must be a phone number (digits, +, (), -, spaces) length 7-20. e.g. +91 98765 43210";
      toast.error('Invalid phone number. ' + hint);
      setRegError('Invalid phone number. ' + hint);
      setActionLoading(false);
      return;
    }
    if (!phonePattern.test(normalizedEmergency)) {
      const hint = "Emergency contact must be a phone number (digits, +, (), -, spaces) length 7-20.";
      toast.error('Invalid emergency contact phone. ' + hint);
      setRegError('Invalid emergency contact phone. ' + hint);
      setActionLoading(false);
      return;
    }
    try {
      const contactInfoJson = JSON.stringify({ email: regEmail.trim() || '', phone: normalizedPhone });
      const addressJson = JSON.stringify({ line1: street.trim(), city: city.trim(), state: stateCode.trim(), zip: zip.trim() });
      const primaryContact = normalizedPhone;
      const dobIso = normalizeDob(dob);
      const genderValue = (gender || '').toString().toUpperCase();

      await registerPatient({
        name: regName.trim(),
        dob: dobIso,
        gender: genderValue,
        contactInfoJson,
        addressJson,
        primaryContact,
        insuranceId: insuranceId.trim() || undefined,
        status: 'ACTIVE'
      });

      toast.success('Patient registered successfully!');
      setShowAddPatientModal(false);
      // Reset Form fields
      setRegName('');
      setRegEmail('');
      setDob('');
      setPhone('');
      setStreet('');
      setCity('');
      setStateCode('');
      setZip('');
      setEmergencyName('');
      setEmergencyPhone('');
      setInsuranceId('');
      loadDashboardData();
    } catch (err: any) {
      // show raw server response when available
      const resp = err?.response?.data;
      let raw = err?.message || 'Failed to register patient';
      try {
        raw = JSON.stringify(resp, null, 2) || raw;
      } catch {}
      setRegError(raw);
      toast.error((err?.message) || 'Failed to register patient');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async (id: number) => {
    try {
      await checkInAppointment(id);
      toast.success('Patient checked in successfully!');
      loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed');
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

  // ── Render Helpers ──
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
    try {
      return JSON.parse(contactJson);
    } catch {
      return { email: '', phone: contactJson };
    }
  };

  const parseAddress = (addressJson: string) => {
    try {
      return JSON.parse(addressJson);
    } catch {
      return { line1: addressJson, city: '', state: '', zip: '' };
    }
  };

  if (loading) {
    return <div className="page-spinner"><div className="spinner"></div></div>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. PATIENT DASHBOARD LAYOUT
  // ─────────────────────────────────────────────────────────────────────────
  if (user?.role === 'PATIENT') {
    const parsedContact = profile ? parseContact(profile.contactInfoJson) : { email: user.email, phone: '' };
    const parsedAddress = profile ? parseAddress(profile.addressJson) : null;

    return (
      <div>
        {/* Welcome */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
              Welcome back, {user.name} 👋
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Access your digital medical records and book consultations.
            </p>
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

            {/* My Booked Appointments list */}
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

          {/* Column Right: Available Clinicians Directory */}
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

        {/* ── Mandatory Patient Registry Form Modal ── */}
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
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Full Name</label>
                    <input 
                      type="text" 
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Date of Birth *</label>
                      <input 
                        type="date" 
                        value={dob} 
                        onChange={e => setDob(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Gender *</label>
                      <select 
                        value={gender} 
                        onChange={e => setGender(e.target.value)} 
                        required
                        style={{ width: '100%', padding: '10px 14px', background: '#0d1527', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Phone Number *</label>
                    <input 
                      type="tel" 
                      placeholder="+91 98765 43210" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Address Details</h3>
                  
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Street Address *</label>
                    <input 
                      type="text" 
                      placeholder="123 Health Ave" 
                      value={street} 
                      onChange={e => setStreet(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>City *</label>
                      <input 
                        type="text" 
                        placeholder="Chennai" 
                        value={city} 
                        onChange={e => setCity(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>State *</label>
                      <input 
                        type="text" 
                        placeholder="TN" 
                        value={stateCode} 
                        onChange={e => setStateCode(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Zip *</label>
                      <input 
                        type="text" 
                        placeholder="600001" 
                        value={zip} 
                        onChange={e => setZip(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Emergency Contact</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Contact Name *</label>
                      <input 
                        type="text" 
                        placeholder="Jane Doe (Spouse)" 
                        value={emergencyName} 
                        onChange={e => setEmergencyName(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Contact Phone *</label>
                      <input 
                        type="tel" 
                        placeholder="+91 98765 00000" 
                        value={emergencyPhone} 
                        onChange={e => setEmergencyPhone(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Insurance Details (Optional)</h3>
                  
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Insurance Policy ID</label>
                    <input 
                      type="text" 
                      placeholder="INS-104928" 
                      value={insuranceId} 
                      onChange={e => setInsuranceId(e.target.value)} 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
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

  // ─────────────────────────────────────────────────────────────────────────
  // 2. RECEPTIONIST DASHBOARD LAYOUT
  // ─────────────────────────────────────────────────────────────────────────
  if (user?.role === 'RECEPTION') {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAppointmentsCount = appointments.filter(a => a.startAt.startsWith(todayStr)).length;
    const checkedInCount = appointments.filter(a => a.startAt.startsWith(todayStr) && a.status === 'CHECKED_IN').length;

    const stats = [
      { label: 'Total Registered Patients', value: patientsList.length.toString(), icon: <Users size={22} />, color: 'primary' },
      { label: 'Today\'s Appointments', value: todayAppointmentsCount.toString(), icon: <CalendarDays size={22} />, color: 'info' },
      { label: 'Patients Checked In', value: checkedInCount.toString(), icon: <Activity size={22} />, color: 'success' },
      { label: 'Scheduled Waitlist', value: appointments.filter(a => a.status === 'SCHEDULED').length.toString(), icon: <Clock size={22} />, color: 'warning' },
    ];

    const filteredPatients = patientsList.filter(p => 
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.mrn.toLowerCase().includes(patientSearch.toLowerCase())
    );

    const todayAppts = appointments.filter(appt => {
      const matchSearch = 
        appt.patientName.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
        appt.clinicianName.toLowerCase().includes(appointmentSearch.toLowerCase());
      const isToday = appt.startAt.startsWith(todayStr);
      return matchSearch && isToday;
    });

    return (
      <div>
        {/* Welcome */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
              Reception Desk 🏢
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Register clinic patients and manage doctor appointments.
            </p>
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

        <div className="dashboard-grid">
          {/* Left Column: Patient Registry Search Desk */}
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
                      {filteredPatients.map(p => {
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

          {/* Right Column: Appointments Desk */}
          <div className="card">
            <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'var(--color-warning)' }} />
                Today's Appointments Desk
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
              {todayAppts.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <p style={{ color: 'var(--color-text-secondary)' }}>No appointments scheduled for today.</p>
                </div>
              ) : (
                <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayAppts.map(appt => (
                        <tr key={appt.apptId}>
                          <td>
                            <div className="cell-main">{appt.patientName}</div>
                            <div className="cell-sub" style={{ fontSize: '0.7rem' }}>MRN: {appt.patientMrn}</div>
                          </td>
                          <td>{appt.clinicianName}</td>
                          <td>{formatTime(appt.startAt)}</td>
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
                              {!(appt.status === 'SCHEDULED' || appt.status === 'CHECKED_IN') && (
                                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>—</span>
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
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Patient Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="Enter patient full name" 
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Patient Email *</label>
                    <input 
                      type="email" 
                      placeholder="patient@email.com" 
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Date of Birth *</label>
                      <input 
                        type="date" 
                        value={dob} 
                        onChange={e => setDob(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Gender *</label>
                      <select 
                        value={gender} 
                        onChange={e => setGender(e.target.value)} 
                        required
                        style={{ width: '100%', padding: '10px 14px', background: '#0d1527', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Phone Number *</label>
                    <input 
                      type="tel" 
                      placeholder="+91 98765 43210" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Address Details</h3>
                  
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Street Address *</label>
                    <input 
                      type="text" 
                      placeholder="123 Health Ave" 
                      value={street} 
                      onChange={e => setStreet(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>City *</label>
                      <input 
                        type="text" 
                        placeholder="Chennai" 
                        value={city} 
                        onChange={e => setCity(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>State *</label>
                      <input 
                        type="text" 
                        placeholder="TN" 
                        value={stateCode} 
                        onChange={e => setStateCode(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Zip *</label>
                      <input 
                        type="text" 
                        placeholder="600001" 
                        value={zip} 
                        onChange={e => setZip(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Emergency Contact</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Contact Name *</label>
                      <input 
                        type="text" 
                        placeholder="Jane Doe (Spouse)" 
                        value={emergencyName} 
                        onChange={e => setEmergencyName(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Contact Phone *</label>
                      <input 
                        type="tel" 
                        placeholder="+91 98765 00000" 
                        value={emergencyPhone} 
                        onChange={e => setEmergencyPhone(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', margin: '24px 0 16px' }}>Insurance Details (Optional)</h3>
                  
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Insurance Policy ID</label>
                    <input 
                      type="text" 
                      placeholder="INS-104928" 
                      value={insuranceId} 
                      onChange={e => setInsuranceId(e.target.value)} 
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
                    />
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

  // ─────────────────────────────────────────────────────────────────────────
  // 3. CLINICIAN / ADMIN (DEFAULT) DASHBOARD LAYOUT
  // ─────────────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Registered Patients', value: patientsList.length.toString(), icon: <Users size={22} />, color: 'primary' },
    { label: 'Today\'s Scheduled Appointments', value: appointments.length.toString(), icon: <CalendarDays size={22} />, color: 'info' },
    { label: 'Active Encounters', value: appointments.filter(a => a.status === 'CHECKED_IN').length.toString(), icon: <Stethoscope size={22} />, color: 'warning' },
    { label: 'Completed Visits Today', value: appointments.filter(a => a.status === 'COMPLETED').length.toString(), icon: <Pill size={22} />, color: 'success' },
  ];

  const recentActivities = [
    { text: 'Patient checked in at Reception Desk', time: 'Just now', color: 'var(--color-info)' },
    { text: 'Encounter completed by Clinician', time: '10 minutes ago', color: 'var(--color-success)' },
    { text: 'New prescription issued for Patient', time: '25 minutes ago', color: 'var(--color-primary)' },
    { text: 'Patient registration updated', time: '1 hour ago', color: 'var(--color-warning)' },
  ];

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
          Good day, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Review clinic outpatient statistics and manage active medical encounters.
        </p>
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
            <p>Manage clinic schedule</p>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Appointments List */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--color-primary)' }} />
              Today's Scheduled Appointments
            </h3>
            <span className="badge badge-primary">{appointments.length}</span>
          </div>
          <div className="card-body" style={{ padding: '16px 0 0' }}>
            {appointments.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No appointments scheduled for today.</p>
              </div>
            ) : (
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
                    {appointments.map((appt, i) => (
                      <tr key={i}>
                        <td className="cell-main">{appt.patientName}</td>
                        <td>{formatTime(appt.startAt)}</td>
                        <td>{appt.serviceType}</td>
                        <td>{getStatusBadge(appt.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} style={{ color: 'var(--color-warning)' }} />
              Recent Activity
            </h3>
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
