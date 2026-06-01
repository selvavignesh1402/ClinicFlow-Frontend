import type { PrescriptionResponseDto, PrescriptionRequestDto } from '../models/types';
import { getPatientById } from './patientService';

// ── Dummy Data ──
const dummyPrescriptions: PrescriptionResponseDto[] = [
  {
    rxId: 1,
    encounterId: 1,
    patientId: 101,
    patientName: 'Arjun Mehta',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    medicationId: 1,
    medicationName: 'Paracetamol 500mg',
    dosage: '1 tablet',
    frequency: 'Three times daily (TDS)',
    durationDays: 5,
    quantity: 15,
    repeats: 0,
    route: 'Oral',
    notes: 'Take after meals. Avoid alcohol.',
    status: 'ACTIVE',
    issuedAt: '2026-06-01T09:30:00',
  },
  {
    rxId: 2,
    encounterId: 2,
    patientId: 102,
    patientName: 'Priya Sharma',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    medicationId: 2,
    medicationName: 'Ibuprofen 400mg',
    dosage: '1 tablet',
    frequency: 'Twice daily (BD)',
    durationDays: 7,
    quantity: 14,
    repeats: 1,
    route: 'Oral',
    notes: 'Take with food. Discontinue if gastric discomfort occurs.',
    status: 'ACTIVE',
    issuedAt: '2026-06-01T10:45:00',
  },
  {
    rxId: 3,
    encounterId: 2,
    patientId: 102,
    patientName: 'Priya Sharma',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    medicationId: 3,
    medicationName: 'Thiocolchicoside 4mg',
    dosage: '1 tablet',
    frequency: 'Twice daily (BD)',
    durationDays: 5,
    quantity: 10,
    repeats: 0,
    route: 'Oral',
    notes: 'May cause drowsiness. Avoid driving.',
    status: 'ACTIVE',
    issuedAt: '2026-06-01T10:45:00',
  },
  {
    rxId: 4,
    encounterId: 3,
    patientId: 103,
    patientName: 'Ravi Kumar',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    medicationId: 4,
    medicationName: 'Metformin 1000mg',
    dosage: '1 tablet',
    frequency: 'Twice daily (BD)',
    durationDays: 90,
    quantity: 180,
    repeats: 3,
    route: 'Oral',
    notes: 'Take with meals. Monitor blood sugar regularly.',
    status: 'ACTIVE',
    issuedAt: '2026-06-01T11:30:00',
  },
  {
    rxId: 5,
    encounterId: 3,
    patientId: 103,
    patientName: 'Ravi Kumar',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    medicationId: 5,
    medicationName: 'Glimepiride 1mg',
    dosage: '1 tablet',
    frequency: 'Once daily (OD)',
    durationDays: 90,
    quantity: 90,
    repeats: 3,
    route: 'Oral',
    notes: 'Take before breakfast. Watch for hypoglycemia signs.',
    status: 'ACTIVE',
    issuedAt: '2026-06-01T11:30:00',
  },
  {
    rxId: 6,
    encounterId: 4,
    patientId: 104,
    patientName: 'Fatima Begum',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    medicationId: 6,
    medicationName: 'Betamethasone Cream 0.1%',
    dosage: 'Apply thin layer',
    frequency: 'Twice daily (BD)',
    durationDays: 10,
    quantity: 1,
    repeats: 0,
    route: 'Topical',
    notes: 'Apply to affected areas only. Do not use on face.',
    status: 'COMPLETED',
    issuedAt: '2026-05-31T14:25:00',
  },
  {
    rxId: 7,
    encounterId: 4,
    patientId: 104,
    patientName: 'Fatima Begum',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    medicationId: 7,
    medicationName: 'Cetirizine 10mg',
    dosage: '1 tablet',
    frequency: 'Once daily (OD)',
    durationDays: 7,
    quantity: 7,
    repeats: 0,
    route: 'Oral',
    notes: 'Take at bedtime. May cause drowsiness.',
    status: 'COMPLETED',
    issuedAt: '2026-05-31T14:25:00',
  },
  {
    rxId: 8,
    encounterId: 1,
    patientId: 101,
    patientName: 'Arjun Mehta',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    medicationId: 8,
    medicationName: 'Amoxicillin 250mg',
    dosage: '1 capsule',
    frequency: 'Three times daily (TDS)',
    durationDays: 7,
    quantity: 21,
    repeats: 0,
    route: 'Oral',
    notes: 'Complete the full course even if symptoms improve.',
    status: 'CANCELLED',
    issuedAt: '2026-05-28T16:00:00',
  },
];

/**
 * TODO: Replace with actual API call
 * GET /api/v1/prescriptions
 */
export async function getAllPrescriptions(): Promise<PrescriptionResponseDto[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...dummyPrescriptions];
}

/**
 * TODO: Replace with actual API call
 * GET /api/v1/prescriptions/{rxId}
 */
export async function getPrescriptionById(rxId: number): Promise<PrescriptionResponseDto> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const rx = dummyPrescriptions.find(p => p.rxId === rxId);
  if (!rx) throw new Error('Prescription not found');
  return { ...rx };
}

/**
 * TODO: Replace with actual API call
 * POST /api/v1/prescriptions
 */
export async function createPrescription(request: PrescriptionRequestDto): Promise<PrescriptionResponseDto> {
  await new Promise(resolve => setTimeout(resolve, 500));
  let patientName = 'New Patient';
  try {
    const p = await getPatientById(request.patientId);
    patientName = p.name;
  } catch (err) {
    console.error('Failed to resolve patient name', err);
  }

  let medicationName = 'New Medication';
  const meds: Record<number, string> = {
    1: 'Paracetamol 500mg',
    2: 'Ibuprofen 400mg',
    3: 'Thiocolchicoside 4mg',
    4: 'Metformin 1000mg',
    5: 'Glimepiride 1mg',
    6: 'Betamethasone Cream 0.1%',
    7: 'Cetirizine 10mg',
    8: 'Amoxicillin 250mg'
  };
  if (meds[request.medicationId]) {
    medicationName = meds[request.medicationId];
  }

  const newRx: PrescriptionResponseDto = {
    rxId: Date.now(),
    encounterId: request.encounterId,
    patientId: request.patientId,
    patientName,
    clinicianId: request.clinicianId,
    clinicianName: 'Dr. Sarah Mitchell',
    medicationId: request.medicationId,
    medicationName,
    dosage: request.dosage,
    frequency: request.frequency,
    durationDays: request.durationDays,
    quantity: request.quantity,
    repeats: request.repeats,
    route: request.route,
    notes: request.notes || '',
    status: 'ACTIVE',
    issuedAt: new Date().toISOString(),
  };
  dummyPrescriptions.push(newRx);
  return newRx;
}

/**
 * TODO: Replace with actual API call
 * PUT /api/v1/prescriptions/{rxId}
 */
export async function updatePrescription(rxId: number, request: PrescriptionRequestDto): Promise<PrescriptionResponseDto> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const idx = dummyPrescriptions.findIndex(p => p.rxId === rxId);
  if (idx === -1) throw new Error('Prescription not found');
  dummyPrescriptions[idx] = {
    ...dummyPrescriptions[idx],
    dosage: request.dosage,
    frequency: request.frequency,
    durationDays: request.durationDays,
    quantity: request.quantity,
    repeats: request.repeats,
    route: request.route,
    notes: request.notes || dummyPrescriptions[idx].notes,
    status: request.status || dummyPrescriptions[idx].status,
  };
  return { ...dummyPrescriptions[idx] };
}

/**
 * TODO: Replace with actual API call
 * DELETE /api/v1/prescriptions/{rxId}
 */
export async function deletePrescription(rxId: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 400));
  const idx = dummyPrescriptions.findIndex(p => p.rxId === rxId);
  if (idx !== -1) dummyPrescriptions.splice(idx, 1);
}
