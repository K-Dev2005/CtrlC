// ---------------------------------------------------------------------------
// Auth helpers — stored in localStorage, used across the app
// ---------------------------------------------------------------------------

export interface AuthState {
  token: string;
  userId: string;
  name: string;
}

export function saveAuthToken(token: string, userId: string, name: string): void {
  localStorage.setItem('ctrlc_token', token);
  localStorage.setItem('ctrlc_userId', userId);
  localStorage.setItem('ctrlc_name', name);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('ctrlc_token');
}

export function getAuthUserId(): string {
  return localStorage.getItem('ctrlc_userId') || 'user_001';
}

export function getAuthName(): string {
  return localStorage.getItem('ctrlc_name') || 'User';
}

export function clearAuth(): void {
  localStorage.removeItem('ctrlc_token');
  localStorage.removeItem('ctrlc_userId');
  localStorage.removeItem('ctrlc_name');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('ctrlc_token');
}
