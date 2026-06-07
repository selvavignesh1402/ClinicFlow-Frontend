import type { PatientResponseDto } from '../models/types';

const BASE_URL = 'http://localhost:8081';

function getAuthHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem('clinic_flow_user');
    if (stored) {
      const authUser = JSON.parse(stored);
      if (authUser?.token) {
        return {
          'Authorization': `Bearer ${authUser.token}`,
          'Content-Type': 'application/json'
        };
      }
    }
  } catch (err) {
    console.error('Error reading auth token', err);
  }
  return {
    'Content-Type': 'application/json'
  };
}

/**
 * GET /api/v1/patients
 */
export async function getAllPatients(): Promise<PatientResponseDto[]> {
  const response = await fetch(`${BASE_URL}/api/v1/patients`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch patients list.');
  }
  return response.json();
}

/**
 * GET /api/v1/patients/{id}
 */
export async function getPatientById(id: number): Promise<PatientResponseDto> {
  const response = await fetch(`${BASE_URL}/api/v1/patients/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Patient with ID ${id} not found.`);
  }
  return response.json();
}

/**
 * GET /api/v1/patients/mrn/{mrn}
 */
export async function getPatientByMrn(mrn: string): Promise<PatientResponseDto> {
  const response = await fetch(`${BASE_URL}/api/v1/patients/mrn/${mrn}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Patient with MRN ${mrn} not found.`);
  }
  return response.json();
}

/**
 * Search patients by name or MRN (client-side filtering of backend list)
 */
export async function searchPatients(query: string): Promise<PatientResponseDto[]> {
  const patients = await getAllPatients();
  if (!query.trim()) return patients;
  
  const q = query.toLowerCase();
  return patients.filter(
    p => p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q)
  );
}

// Global cached patients dictionary to resolve MRN synchronously
let cachedPatients: PatientResponseDto[] = [];

// Initialize/reload cache
async function refreshPatientsCache() {
  try {
    cachedPatients = await getAllPatients();
  } catch (err) {
    console.error('Failed to refresh patients cache', err);
  }
}

// Run initial load
refreshPatientsCache();

/**
 * Helper to get Patient MRN synchronously by patientId
 */
export function getPatientMrnSync(patientId: number): string {
  const p = cachedPatients.find(pat => pat.patientId === patientId);
  if (p) return p.mrn;
  
  // Asynchronously try to refresh cache for future lookups
  refreshPatientsCache();
  return `MRN-${patientId}`;
}
