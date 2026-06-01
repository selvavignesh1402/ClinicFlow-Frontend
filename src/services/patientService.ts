import type { PatientResponseDto } from '../models/types';

// ── Dummy Patients ──
export const dummyPatients: PatientResponseDto[] = [
  {
    patientId: 101,
    mrn: 'MRN-2026-001',
    name: 'Arjun Mehta',
    dob: '1990-03-15',
    gender: 'Male',
    contactInfoJson: JSON.stringify({ email: 'arjun.mehta@email.com', phone: '+91 98765 00101' }),
    addressJson: JSON.stringify({ line1: '42 MG Road', city: 'Chennai', state: 'Tamil Nadu', zip: '600001' }),
    primaryContact: '+91 98765 00101',
    insuranceId: 'INS-101',
    status: 'ACTIVE',
    createdAt: '2026-01-10T09:00:00',
    updatedAt: '2026-05-28T14:30:00',
  },
  {
    patientId: 102,
    mrn: 'MRN-2026-002',
    name: 'Priya Sharma',
    dob: '1985-07-22',
    gender: 'Female',
    contactInfoJson: JSON.stringify({ email: 'priya.sharma@email.com', phone: '+91 98765 00102' }),
    addressJson: JSON.stringify({ line1: '15 Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', zip: '600040' }),
    primaryContact: '+91 98765 00102',
    insuranceId: 'INS-102',
    status: 'ACTIVE',
    createdAt: '2026-02-05T10:00:00',
    updatedAt: '2026-06-01T10:45:00',
  },
  {
    patientId: 103,
    mrn: 'MRN-2026-003',
    name: 'Ravi Kumar',
    dob: '1972-11-08',
    gender: 'Male',
    contactInfoJson: JSON.stringify({ email: 'ravi.kumar@email.com', phone: '+91 98765 00103' }),
    addressJson: JSON.stringify({ line1: '8 T Nagar', city: 'Chennai', state: 'Tamil Nadu', zip: '600017' }),
    primaryContact: '+91 98765 00103',
    insuranceId: 'INS-103',
    status: 'ACTIVE',
    createdAt: '2025-11-20T11:00:00',
    updatedAt: '2026-06-01T11:30:00',
  },
  {
    patientId: 104,
    mrn: 'MRN-2026-004',
    name: 'Fatima Begum',
    dob: '1995-01-30',
    gender: 'Female',
    contactInfoJson: JSON.stringify({ email: 'fatima.begum@email.com', phone: '+91 98765 00104' }),
    addressJson: JSON.stringify({ line1: '23 Velachery Main Road', city: 'Chennai', state: 'Tamil Nadu', zip: '600042' }),
    primaryContact: '+91 98765 00104',
    insuranceId: '',
    status: 'ACTIVE',
    createdAt: '2026-03-12T14:00:00',
    updatedAt: '2026-05-31T14:25:00',
  },
  {
    patientId: 105,
    mrn: 'MRN-2026-005',
    name: 'Suresh Patel',
    dob: '1968-06-18',
    gender: 'Male',
    contactInfoJson: JSON.stringify({ email: 'suresh.patel@email.com', phone: '+91 98765 00105' }),
    addressJson: JSON.stringify({ line1: '5 Adyar', city: 'Chennai', state: 'Tamil Nadu', zip: '600020' }),
    primaryContact: '+91 98765 00105',
    insuranceId: 'INS-105',
    status: 'ACTIVE',
    createdAt: '2026-04-01T16:00:00',
    updatedAt: '2026-05-31T16:30:00',
  },
];

/**
 * TODO: Replace with actual API call
 * GET /api/v1/patients
 */
export async function getAllPatients(): Promise<PatientResponseDto[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...dummyPatients];
}

/**
 * TODO: Replace with actual API call
 * GET /api/v1/patients/{id}
 */
export async function getPatientById(id: number): Promise<PatientResponseDto> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const p = dummyPatients.find(pat => pat.patientId === id);
  if (!p) throw new Error('Patient not found');
  return { ...p };
}

/**
 * TODO: Replace with actual API call
 * GET /api/v1/patients/mrn/{mrn}
 */
export async function getPatientByMrn(mrn: string): Promise<PatientResponseDto> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const p = dummyPatients.find(pat => pat.mrn.toLowerCase() === mrn.toLowerCase());
  if (!p) throw new Error('Patient not found');
  return { ...p };
}

/**
 * Search patients by name or MRN (for autocomplete)
 */
export async function searchPatients(query: string): Promise<PatientResponseDto[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  if (!query.trim()) return [...dummyPatients];
  const q = query.toLowerCase();
  return dummyPatients.filter(
    p => p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q)
  );
}

/**
 * Helper to get Patient MRN synchronously by patientId
 */
export function getPatientMrnSync(patientId: number): string {
  const p = dummyPatients.find(pat => pat.patientId === patientId);
  return p ? p.mrn : `MRN-${patientId}`;
}

