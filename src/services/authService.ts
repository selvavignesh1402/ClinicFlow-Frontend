import type {
  AuthenticationRequest,
  RegisterRequest,
  AuthenticationResponse,
} from '../models/types';

// ── Dummy credentials ──
const DUMMY_USERS = [
  { userId: 1, name: 'Dr. Admin', email: 'admin@clinic.com', password: 'admin123', role: 'ADMIN' as const },
  { userId: 2, name: 'Dr. Sarah Mitchell', email: 'clinician@clinic.com', password: 'clinician123', role: 'CLINICIAN' as const },
  { userId: 3, name: 'Jane Doe', email: 'patient@clinic.com', password: 'patient123', role: 'PATIENT' as const },
  { userId: 4, name: 'Mark Johnson', email: 'reception@clinic.com', password: 'reception123', role: 'RECEPTION' as const },
];

/**
 * TODO: Replace with actual API call
 * POST /api/v1/auth/authenticate
 */
export async function login(request: AuthenticationRequest): Promise<AuthenticationResponse & { user: { userId: number; name: string; email: string; role: string } }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const user = DUMMY_USERS.find(u => u.email === request.email && u.password === request.password);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  return {
    token: `dummy-jwt-token-${user.userId}-${Date.now()}`,
    message: 'Login successful',
    user: { userId: user.userId, name: user.name, email: user.email, role: user.role },
  };
}

/**
 * TODO: Replace with actual API call
 * POST /api/v1/auth/register
 */
export async function register(request: RegisterRequest): Promise<AuthenticationResponse> {
  await new Promise(resolve => setTimeout(resolve, 800));

  if (DUMMY_USERS.some(u => u.email === request.email)) {
    throw new Error('Email already registered');
  }

  return {
    token: `dummy-jwt-token-new-${Date.now()}`,
    message: 'Registration successful',
  };
}
