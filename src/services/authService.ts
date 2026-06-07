import type {
  AuthenticationRequest,
  RegisterRequest,
  AuthenticationResponse,
  UserRole
} from '../models/types';

const BASE_URL = 'http://localhost:8081';

// Helper to decode JWT claims in client side
function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to decode JWT token', err);
    return null;
  }
}

/**
 * POST /api/v1/auth/authenticate
 */
export async function login(request: AuthenticationRequest): Promise<AuthenticationResponse & { user: { userId: number; name: string; email: string; role: UserRole } }> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/authenticate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Authentication failed. Please verify your credentials.');
  }

  const data: AuthenticationResponse = await response.json();
  const decoded = decodeJwt(data.token);
  
  if (!decoded) {
    throw new Error('Failed to resolve authenticated session claims.');
  }

  return {
    token: data.token,
    message: data.message || 'Login successful',
    user: {
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.sub, // JWT Subject is email
      role: decoded.role as UserRole,
    },
  };
}

/**
 * POST /api/v1/auth/register
 */
export async function register(request: RegisterRequest): Promise<AuthenticationResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Registration failed.');
  }

  return response.json();
}
