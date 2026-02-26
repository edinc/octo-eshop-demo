import { describe, it, expect, beforeEach } from 'vitest';
import reducer, { setCredentials, setUser, logout, setLoading } from './authSlice';

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sets credentials and persists tokens', () => {
    const state = reducer(
      undefined,
      setCredentials({
        user: { id: 'u1', email: 'test@example.com' } as any,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
    );

    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('access-token');
    expect(localStorage.getItem('accessToken')).toBe('access-token');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
  });

  it('updates user and handles loading state', () => {
    let state = reducer(undefined, setUser({ id: 'u2', email: 'new@example.com' } as any));
    state = reducer(state, setLoading(true));

    expect(state.user?.id).toBe('u2');
    expect(state.isLoading).toBe(true);
  });

  it('clears auth state and local storage on logout', () => {
    localStorage.setItem('accessToken', 'to-clear');
    localStorage.setItem('refreshToken', 'to-clear');
    const state = reducer(
      {
        user: { id: 'u1' } as any,
        accessToken: 'to-clear',
        refreshToken: 'to-clear',
        isAuthenticated: true,
        isLoading: false,
      },
      logout()
    );

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
