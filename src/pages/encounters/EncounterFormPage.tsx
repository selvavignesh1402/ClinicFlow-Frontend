import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEncounter } from '../../services/encounterService';
import { searchPatients } from '../../services/patientService';
import type { PatientResponseDto } from '../../models/types';
import { ArrowLeft, Save, User } from 'lucide-react';

export default function EncounterFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [patientMrn, setPatientMrn] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientResponseDto | null>(null);
  const [searchResults, setSearchResults] = useState<PatientResponseDto[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [patientError, setPatientError] = useState('');

  const [visitType, setVisitType] = useState('New Visit');
  const [chiefComplaint, setChiefComplaint] = useState('');

  // Vitals
  const [bp, setBp] = useState('');
  const [temp, setTemp] = useState('');
  const [pulse, setPulse] = useState('');
  const [spo2, setSpo2] = useState('');
  const [weight, setWeight] = useState('');

  // SOAP Notes
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  // Diagnoses & Orders
  const [diagnoses, setDiagnoses] = useState('');
  const [orders, setOrders] = useState('');

  const handlePatientSearch = async (val: string) => {
    setPatientMrn(val);
    setPatientError('');
    if (!val.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setSelectedPatient(null);
      return;
    }
    try {
      const results = await searchPatients(val);
      setSearchResults(results);
      setShowDropdown(true);

      const exact = results.find(p => p.mrn.toLowerCase() === val.trim().toLowerCase());
      if (exact) {
        setSelectedPatient(exact);
        setShowDropdown(false);
      } else {
        setSelectedPatient(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setPatientError('Please search and select a valid patient by MRN.');
      return;
    }

    setLoading(true);

    try {
      const newEnc = await createEncounter({
        patientId: selectedPatient.patientId,
        visitType,
        chiefComplaint,
        vitalsJson: JSON.stringify({ bp, temp, pulse, spo2, weight }),
        notesJson: JSON.stringify({ subjective, objective, assessment, plan }),
        diagnosesJson: JSON.stringify(diagnoses.split('\n').filter(Boolean)),
        ordersJson: JSON.stringify(orders.split('\n').filter(Boolean)),
      });
      navigate(`/encounters/${newEnc.encounterId}`);
    } catch (err) {
      console.error('Failed to create encounter', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/encounters')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>New Encounter</h1>
            <p>Create a new clinical encounter</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Patient & Visit Info */}
        <div className="section-card">
          <div className="section-card-header">
            <h3>Patient & Visit Information</h3>
          </div>
          <div className="section-card-body">
            <div className="form-row-3">
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Patient MRN <span className="required">*</span></label>
                <div className="autocomplete-container">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Type MRN or Name..."
                    value={patientMrn}
                    onChange={e => handlePatientSearch(e.target.value)}
                    onFocus={() => setShowDropdown(searchResults.length > 0)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    required
                  />
                  {showDropdown && searchResults.length > 0 && (
                    <div className="autocomplete-dropdown">
                      {searchResults.map(p => (
                        <div
                          key={p.patientId}
                          className="autocomplete-item"
                          onMouseDown={() => {
                            setSelectedPatient(p);
                            setPatientMrn(p.mrn);
                            setSearchResults([]);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="autocomplete-item-name">{p.name}</div>
                          <div className="autocomplete-item-sub">MRN: {p.mrn} | DOB: {p.dob}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {patientError && <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '4px' }}>{patientError}</div>}
                {selectedPatient && (
                  <div className="patient-summary-card">
                    <div className="patient-summary-icon">
                      <User size={18} />
                    </div>
                    <div className="patient-summary-info">
                      <div className="patient-summary-name">{selectedPatient.name}</div>
                      <div className="patient-summary-meta">MRN: {selectedPatient.mrn} | DOB: {selectedPatient.dob} | Gender: {selectedPatient.gender}</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Visit Type <span className="required">*</span></label>
                <select className="form-select" value={visitType} onChange={e => setVisitType(e.target.value)}>
                  <option value="New Visit">New Visit</option>
                  <option value="Follow-Up">Follow-Up</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Routine Check">Routine Check</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Chief Complaint <span className="required">*</span></label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Primary reason for visit"
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div className="section-card">
          <div className="section-card-header">
            <h3>Vitals</h3>
          </div>
          <div className="section-card-body">
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Blood Pressure</label>
                <input className="form-input" placeholder="e.g. 120/80" value={bp} onChange={e => setBp(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Temperature</label>
                <input className="form-input" placeholder="e.g. 98.6°F" value={temp} onChange={e => setTemp(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Pulse</label>
                <input className="form-input" placeholder="e.g. 72 bpm" value={pulse} onChange={e => setPulse(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">SpO2</label>
                <input className="form-input" placeholder="e.g. 98%" value={spo2} onChange={e => setSpo2(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Weight</label>
                <input className="form-input" placeholder="e.g. 70 kg" value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* SOAP Notes */}
        <div className="section-card">
          <div className="section-card-header">
            <h3>Clinical Notes (SOAP)</h3>
          </div>
          <div className="section-card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Subjective</label>
                <textarea
                  className="form-textarea"
                  placeholder="Patient's reported symptoms, history..."
                  value={subjective}
                  onChange={e => setSubjective(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Objective</label>
                <textarea
                  className="form-textarea"
                  placeholder="Physical exam findings, observations..."
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assessment</label>
                <textarea
                  className="form-textarea"
                  placeholder="Clinical assessment, differential diagnoses..."
                  value={assessment}
                  onChange={e => setAssessment(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Plan</label>
                <textarea
                  className="form-textarea"
                  placeholder="Treatment plan, follow-up instructions..."
                  value={plan}
                  onChange={e => setPlan(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Diagnoses & Orders */}
        <div className="section-card">
          <div className="section-card-header">
            <h3>Diagnoses & Orders</h3>
          </div>
          <div className="section-card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Diagnoses</label>
                <textarea
                  className="form-textarea"
                  placeholder="One diagnosis per line (e.g. J06.9 - Acute upper respiratory infection)"
                  value={diagnoses}
                  onChange={e => setDiagnoses(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Orders</label>
                <textarea
                  className="form-textarea"
                  placeholder="One order per line (e.g. CBC, CRP, X-Ray Chest)"
                  value={orders}
                  onChange={e => setOrders(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/encounters')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            <Save size={18} />
            {loading ? 'Saving...' : 'Create Encounter'}
          </button>
        </div>
      </form>
    </div>
  );
}
