import api from './api';
import type { PatientResponseDto, PatientRequestDto } from '../models/types';

/**
 * GET /api/v1/patients
 */
export async function getAllPatients(): Promise<PatientResponseDto[]> {
  try {
    const response = await api.get<PatientResponseDto[]>('/api/v1/patients');
    return response.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.message || 'Failed to fetch patients list');
  }
}

/**
 * GET /api/v1/patients/{id}
 */
export async function getPatientById(id: number): Promise<PatientResponseDto> {
  try {
    const response = await api.get<PatientResponseDto>(`/api/v1/patients/${id}`);
    return response.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.message || `Failed to fetch patient details with id ${id}`);
  }
}

/**
 * GET /api/v1/patients/mrn/{mrn}
 */
export async function getPatientByMrn(mrn: string): Promise<PatientResponseDto> {
  try {
    const response = await api.get<PatientResponseDto>(`/api/v1/patients/mrn/${mrn}`);
    return response.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.message || `Failed to fetch patient details with MRN ${mrn}`);
  }
}

/**
 * GET /api/v1/patients/me
 * Retrieves the logged-in patient's record. Returns null if profile is not created yet (204 No Content).
 */
export async function getMyProfile(): Promise<PatientResponseDto | null> {
  try {
    const response = await api.get<PatientResponseDto>('/api/v1/patients/me');
    if (response.status === 204) {
      return null;
    }
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.status === 204) {
      return null;
    }
    throw new Error(err.response?.data?.message || 'Failed to fetch user profile');
  }
}

/**
 * POST /api/v1/patients
 * Registers a new patient. Can be called by Reception, Admin, or Patient (self-registration).
 */
export async function registerPatient(request: PatientRequestDto): Promise<PatientResponseDto> {
  try {
    const response = await api.post<PatientResponseDto>('/api/v1/patients', request);
    return response.data;
  } catch (err: any) {
    // Rethrow the original error (axios error) so callers can inspect `err.response` for details
    throw err;
  }
}

/**
 * PUT /api/v1/patients/{id}
 */
export async function updatePatient(id: number, request: PatientRequestDto): Promise<PatientResponseDto> {
  try {
    const response = await api.put<PatientResponseDto>(`/api/v1/patients/${id}`, request);
    return response.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.message || 'Failed to update patient profile');
  }
}

/**
 * Search patients by name or MRN (for autocomplete)
 */
export async function searchPatients(query: string): Promise<PatientResponseDto[]> {
  try {
    const patients = await getAllPatients();
    if (!query.trim()) return patients;
    const q = query.toLowerCase();
    return patients.filter(
      p => p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q)
    );
  } catch (e) {
    console.error('Search patients failed, falling back to empty list', e);
    return [];
  }
}

/**
 * Helper to get Patient MRN synchronously by patientId.
 * Used for listing overlays where MRN needs to be printed inline.
 */
export function getPatientMrnSync(patientId: number): string {
  return `MRN-${patientId}`;
}
