import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEncounterById, completeEncounter, deleteEncounter } from '../../services/encounterService';
import type { EncounterResponseDto } from '../../models/types';
import {
  ArrowLeft,
  CheckCircle,
  Trash2,
  Edit,
  Heart,
  FileText,
  Stethoscope,
  ClipboardList,
  Pill,
  User,
  Clock,
} from 'lucide-react';
import { getPatientMrnSync } from '../../services/patientService';

export default function EncounterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [encounter, setEncounter] = useState<EncounterResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadEncounter();
  }, [id]);

  const loadEncounter = async () => {
    try {
      const data = await getEncounterById(Number(id));
      setEncounter(data);
    } catch (err) {
      console.error('Failed to load encounter', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!encounter || encounter.status !== 'IN_PROGRESS') return;
    setActionLoading(true);
    try {
      const updated = await completeEncounter(encounter.encounterId);
      setEncounter(updated);
    } catch (err) {
      console.error('Failed to complete encounter', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!encounter) return;
    if (!confirm('Are you sure you want to delete this encounter?')) return;
    setActionLoading(true);
    try {
      await deleteEncounter(encounter.encounterId);
      navigate('/encounters', { replace: true });
    } catch (err) {
      console.error('Failed to delete encounter', err);
    } finally {
      setActionLoading(false);
    }
  };

  const safeParse = (json: string): unknown => {
    try { return JSON.parse(json); }
    catch { return null; }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
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

  if (!encounter) {
    return (
      <div className="empty-state">
        <h3>Encounter not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/encounters')}>Back to list</button>
      </div>
    );
  }

  const vitals = safeParse(encounter.vitalsJson) as Record<string, string> | null;
  const notes = safeParse(encounter.notesJson) as Record<string, string> | null;
  const diagnoses = safeParse(encounter.diagnosesJson) as string[] | null;
  const orders = safeParse(encounter.ordersJson) as string[] | null;
  const prescriptions = safeParse(encounter.prescriptionsJson) as Array<Record<string, string>> | null;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/encounters')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1>Encounter #{encounter.encounterId}</h1>
              {getStatusBadge(encounter.status)}
            </div>
            <p>{encounter.visitType} — {encounter.patientName}</p>
          </div>
        </div>
        <div className="page-header-actions">
          {encounter.status === 'IN_PROGRESS' && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate(`/encounters/${encounter.encounterId}/edit`)}>
                <Edit size={16} /> Edit
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/prescriptions/new', { state: { encounterId: encounter.encounterId, patientId: encounter.patientId } })}>
                <Pill size={16} /> Add Prescription
              </button>
              <button className="btn btn-primary" onClick={handleComplete} disabled={actionLoading}>
                <CheckCircle size={16} /> {actionLoading ? 'Completing...' : 'Complete'}
              </button>
            </>
          )}
          <button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Patient & Clinician Info */}
      <div className="section-card">
        <div className="section-card-header">
          <h3><User size={16} /> Patient & Clinician Info</h3>
        </div>
        <div className="section-card-body">
          <div className="detail-grid">
            <div className="detail-item">
              <label>Patient</label>
              <p>{encounter.patientName}</p>
            </div>
            <div className="detail-item">
              <label>Patient MRN</label>
              <p>{getPatientMrnSync(encounter.patientId)}</p>
            </div>
            <div className="detail-item">
              <label>Clinician</label>
              <p>{encounter.clinicianName}</p>
            </div>
            <div className="detail-item">
              <label>Visit Type</label>
              <p>{encounter.visitType}</p>
            </div>
            <div className="detail-item">
              <label>Started At</label>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {formatDateTime(encounter.startAt)}</p>
            </div>
            <div className="detail-item">
              <label>Ended At</label>
              <p>{encounter.endAt ? formatDateTime(encounter.endAt) : '—'}</p>
            </div>
            {encounter.signedByName && (
              <div className="detail-item">
                <label>Signed By</label>
                <p>{encounter.signedByName} — {formatDateTime(encounter.signedAt)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chief Complaint */}
      <div className="section-card">
        <div className="section-card-header">
          <h3><Stethoscope size={16} /> Chief Complaint</h3>
        </div>
        <div className="section-card-body">
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.7 }}>{encounter.chiefComplaint}</p>
        </div>
      </div>

      {/* Vitals */}
      {vitals && (
        <div className="section-card">
          <div className="section-card-header">
            <h3><Heart size={16} /> Vitals</h3>
          </div>
          <div className="section-card-body">
            <div className="detail-grid">
              {Object.entries(vitals).map(([key, value]) => (
                <div className="detail-item" key={key}>
                  <label>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
                  <p>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clinical Notes */}
      {notes && (
        <div className="section-card">
          <div className="section-card-header">
            <h3><FileText size={16} /> Clinical Notes (SOAP)</h3>
          </div>
          <div className="section-card-body">
            {Object.entries(notes).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  {key}
                </label>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--color-text)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnoses */}
      {diagnoses && diagnoses.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h3><ClipboardList size={16} /> Diagnoses</h3>
            <span className="badge badge-primary">{diagnoses.length}</span>
          </div>
          <div className="section-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {diagnoses.map((diag, i) => (
                <div key={i} style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                  {diag}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orders */}
      {orders && orders.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h3><ClipboardList size={16} /> Orders</h3>
            <span className="badge badge-info">{orders.length}</span>
          </div>
          <div className="section-card-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {orders.map((order, i) => (
                <span key={i} className="badge badge-info">{order}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions */}
      {prescriptions && prescriptions.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h3><Pill size={16} /> Prescriptions</h3>
            <span className="badge badge-success">{prescriptions.length}</span>
          </div>
          <div className="section-card-body">
            <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((rx, i) => (
                    <tr key={i}>
                      <td className="cell-main">{rx.medication}</td>
                      <td>{rx.dosage}</td>
                      <td>{rx.frequency}</td>
                      <td>{rx.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
