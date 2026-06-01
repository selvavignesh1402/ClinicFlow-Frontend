import type { EncounterResponseDto, EncounterRequestDto } from '../models/types';
import { getPatientById } from './patientService';

// ── Dummy Data ──
const dummyEncounters: EncounterResponseDto[] = [
  {
    encounterId: 1,
    patientId: 101,
    patientName: 'Arjun Mehta',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    visitType: 'Follow-Up',
    chiefComplaint: 'Persistent cough and mild fever for 3 days',
    vitalsJson: JSON.stringify({ bp: '120/80', temp: '99.2°F', pulse: '78', spo2: '97%', weight: '72 kg' }),
    notesJson: JSON.stringify({ subjective: 'Patient reports dry cough, no sputum. Low-grade fever. No chest pain.', objective: 'Lungs clear on auscultation. Throat mildly erythematous.', assessment: 'Upper respiratory tract infection', plan: 'Prescribe antipyretics and cough suppressant. Follow up in 5 days if symptoms persist.' }),
    diagnosesJson: JSON.stringify(['J06.9 - Acute upper respiratory infection', 'R50.9 - Fever, unspecified']),
    ordersJson: JSON.stringify(['CBC', 'CRP']),
    prescriptionsJson: JSON.stringify([{ medication: 'Paracetamol 500mg', dosage: '1 tab', frequency: 'TDS', duration: '5 days' }]),
    startAt: '2026-06-01T09:00:00',
    endAt: '2026-06-01T09:30:00',
    status: 'COMPLETED',
    signedById: 2,
    signedByName: 'Dr. Sarah Mitchell',
    signedAt: '2026-06-01T09:30:00',
  },
  {
    encounterId: 2,
    patientId: 102,
    patientName: 'Priya Sharma',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    visitType: 'New Visit',
    chiefComplaint: 'Lower back pain radiating to left leg',
    vitalsJson: JSON.stringify({ bp: '130/85', temp: '98.6°F', pulse: '82', spo2: '98%', weight: '65 kg' }),
    notesJson: JSON.stringify({ subjective: 'Patient reports pain since 1 week, worsens on bending. Numbness in left foot.', objective: 'Positive SLR test on left. No motor weakness.', assessment: 'Lumbar radiculopathy - likely L5-S1', plan: 'Order MRI lumbar spine. Prescribe NSAIDs and muscle relaxants. Refer to physiotherapy.' }),
    diagnosesJson: JSON.stringify(['M54.1 - Radiculopathy', 'M54.5 - Low back pain']),
    ordersJson: JSON.stringify(['MRI Lumbar Spine', 'NCV/EMG']),
    prescriptionsJson: JSON.stringify([{ medication: 'Ibuprofen 400mg', dosage: '1 tab', frequency: 'BD', duration: '7 days' }, { medication: 'Thiocolchicoside 4mg', dosage: '1 tab', frequency: 'BD', duration: '5 days' }]),
    startAt: '2026-06-01T10:00:00',
    endAt: '2026-06-01T10:45:00',
    status: 'COMPLETED',
    signedById: 2,
    signedByName: 'Dr. Sarah Mitchell',
    signedAt: '2026-06-01T10:45:00',
  },
  {
    encounterId: 3,
    patientId: 103,
    patientName: 'Ravi Kumar',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    visitType: 'Follow-Up',
    chiefComplaint: 'Diabetes management - routine check',
    vitalsJson: JSON.stringify({ bp: '140/90', temp: '98.4°F', pulse: '76', spo2: '99%', weight: '88 kg' }),
    notesJson: JSON.stringify({ subjective: 'Patient compliant with metformin. Reports occasional dizziness in mornings.', objective: 'Fasting glucose 142 mg/dL. HbA1c 7.2%. BMI 30.1.', assessment: 'Type 2 DM - suboptimal control', plan: 'Increase metformin to 1000mg BD. Add glimepiride 1mg OD. Dietary counseling. Recheck HbA1c in 3 months.' }),
    diagnosesJson: JSON.stringify(['E11.65 - Type 2 DM with hyperglycemia']),
    ordersJson: JSON.stringify(['HbA1c', 'Lipid Panel', 'Renal Function Test']),
    prescriptionsJson: JSON.stringify([{ medication: 'Metformin 1000mg', dosage: '1 tab', frequency: 'BD', duration: '90 days' }, { medication: 'Glimepiride 1mg', dosage: '1 tab', frequency: 'OD', duration: '90 days' }]),
    startAt: '2026-06-01T11:15:00',
    endAt: '',
    status: 'IN_PROGRESS',
    signedById: 0,
    signedByName: '',
    signedAt: '',
  },
  {
    encounterId: 4,
    patientId: 104,
    patientName: 'Fatima Begum',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    visitType: 'New Visit',
    chiefComplaint: 'Skin rash on both arms',
    vitalsJson: JSON.stringify({ bp: '118/76', temp: '98.6°F', pulse: '70', spo2: '99%', weight: '58 kg' }),
    notesJson: JSON.stringify({ subjective: 'Red itchy rash for 5 days. Used new laundry detergent recently.', objective: 'Bilateral erythematous papular rash on forearms. No vesicles.', assessment: 'Contact dermatitis - likely allergic', plan: 'Avoid irritant. Prescribe topical corticosteroid and antihistamine.' }),
    diagnosesJson: JSON.stringify(['L23.9 - Allergic contact dermatitis, unspecified']),
    ordersJson: JSON.stringify([]),
    prescriptionsJson: JSON.stringify([{ medication: 'Betamethasone cream 0.1%', dosage: 'Apply thin layer', frequency: 'BD', duration: '10 days' }, { medication: 'Cetirizine 10mg', dosage: '1 tab', frequency: 'OD', duration: '7 days' }]),
    startAt: '2026-05-31T14:00:00',
    endAt: '2026-05-31T14:25:00',
    status: 'COMPLETED',
    signedById: 2,
    signedByName: 'Dr. Sarah Mitchell',
    signedAt: '2026-05-31T14:25:00',
  },
  {
    encounterId: 5,
    patientId: 105,
    patientName: 'Suresh Patel',
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    visitType: 'Emergency',
    chiefComplaint: 'Severe chest pain and breathlessness',
    vitalsJson: JSON.stringify({ bp: '160/100', temp: '98.8°F', pulse: '110', spo2: '92%', weight: '95 kg' }),
    notesJson: JSON.stringify({ subjective: 'Sudden onset chest pain 2 hours ago. Radiating to left arm. Diaphoresis present.', objective: 'ECG shows ST elevation in leads II, III, aVF. Troponin-I elevated.', assessment: 'Acute inferior STEMI', plan: 'Immediate cardiology referral. Load with Aspirin 300mg + Clopidogrel 300mg. Start heparin drip. Prep for PCI.' }),
    diagnosesJson: JSON.stringify(['I21.1 - Acute ST elevation myocardial infarction of inferior wall']),
    ordersJson: JSON.stringify(['ECG', 'Troponin-I', 'Echo', 'CBC', 'BMP']),
    prescriptionsJson: JSON.stringify([]),
    startAt: '2026-05-31T16:30:00',
    endAt: '',
    status: 'IN_PROGRESS',
    signedById: 0,
    signedByName: '',
    signedAt: '',
  },
];

/**
 * TODO: Replace with actual API call
 * GET /api/v1/clinician/encounters
 */
export async function getAllEncounters(): Promise<EncounterResponseDto[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...dummyEncounters];
}

/**
 * TODO: Replace with actual API call
 * GET /api/v1/clinician/encounters/{encounterId}
 */
export async function getEncounterById(encounterId: number): Promise<EncounterResponseDto> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const enc = dummyEncounters.find(e => e.encounterId === encounterId);
  if (!enc) throw new Error('Encounter not found');
  return { ...enc };
}

/**
 * TODO: Replace with actual API call
 * POST /api/v1/clinician/encounters
 */
export async function createEncounter(request: EncounterRequestDto): Promise<EncounterResponseDto> {
  await new Promise(resolve => setTimeout(resolve, 500));
  let patientName = 'New Patient';
  try {
    const p = await getPatientById(request.patientId);
    patientName = p.name;
  } catch (err) {
    console.error('Failed to resolve patient name', err);
  }

  const newEnc: EncounterResponseDto = {
    encounterId: Date.now(),
    patientId: request.patientId,
    patientName,
    clinicianId: 2,
    clinicianName: 'Dr. Sarah Mitchell',
    visitType: request.visitType,
    chiefComplaint: request.chiefComplaint,
    vitalsJson: request.vitalsJson,
    notesJson: request.notesJson,
    diagnosesJson: request.diagnosesJson,
    ordersJson: request.ordersJson,
    prescriptionsJson: request.prescriptionsJson || '[]',
    startAt: new Date().toISOString(),
    endAt: '',
    status: 'IN_PROGRESS',
    signedById: 0,
    signedByName: '',
    signedAt: '',
  };
  dummyEncounters.push(newEnc);
  return newEnc;
}

/**
 * TODO: Replace with actual API call
 * PUT /api/v1/clinician/encounters/{encounterId}
 */
export async function updateEncounter(encounterId: number, request: EncounterRequestDto): Promise<EncounterResponseDto> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const idx = dummyEncounters.findIndex(e => e.encounterId === encounterId);
  if (idx === -1) throw new Error('Encounter not found');
  dummyEncounters[idx] = {
    ...dummyEncounters[idx],
    ...request,
    prescriptionsJson: request.prescriptionsJson || dummyEncounters[idx].prescriptionsJson,
  };
  return { ...dummyEncounters[idx] };
}

/**
 * TODO: Replace with actual API call
 * PATCH /api/v1/clinician/encounters/status/{encounterId}
 */
export async function completeEncounter(encounterId: number): Promise<EncounterResponseDto> {
  await new Promise(resolve => setTimeout(resolve, 400));
  const idx = dummyEncounters.findIndex(e => e.encounterId === encounterId);
  if (idx === -1) throw new Error('Encounter not found');
  dummyEncounters[idx].status = 'COMPLETED';
  dummyEncounters[idx].endAt = new Date().toISOString();
  dummyEncounters[idx].signedAt = new Date().toISOString();
  dummyEncounters[idx].signedById = 2;
  dummyEncounters[idx].signedByName = 'Dr. Sarah Mitchell';
  return { ...dummyEncounters[idx] };
}

/**
 * TODO: Replace with actual API call
 * DELETE /api/v1/clinician/encounters/{encounterId}
 */
export async function deleteEncounter(encounterId: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 400));
  const idx = dummyEncounters.findIndex(e => e.encounterId === encounterId);
  if (idx !== -1) dummyEncounters.splice(idx, 1);
}
