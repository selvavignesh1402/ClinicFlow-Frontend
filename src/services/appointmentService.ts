import type { AppointmentResponseDto } from '../models/types';

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
 * GET /api/v1/appointments
 */
export async function getAllAppointments(): Promise<AppointmentResponseDto[]> {
  const response = await fetch(`${BASE_URL}/api/v1/appointments`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch appointments.');
  }
  return response.json();
}
