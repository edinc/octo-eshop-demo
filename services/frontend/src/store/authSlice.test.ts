import { describe, it, expect, beforeEach } from 'vitest';
import reducer, { setCredentials, setUser, logout, setLoading } from './authSlice';
import type { AuthState, User } from '@/types';

const createUser = (id: string, email: string): User => ({
  id,
  email,
  firstName: 'Test',
  lastName: 'User',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sets credentials and persists tokens', () => {
    const state = reducer(
      undefined,
      setCredentials({
        user: createUser('u1', 'test@example.com'),
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
    let state = reducer(undefined, setUser(createUser('u2', 'new@example.com')));
    state = reducer(state, setLoading(true));

    expect(state.user?.id).toBe('u2');
    expect(state.isLoading).toBe(true);
  });

  it('clears auth state and local storage on logout', () => {
    localStorage.setItem('accessToken', 'to-clear');
    localStorage.setItem('refreshToken', 'to-clear');
    const authenticatedState: AuthState = {
      user: createUser('u1', 'test@example.com'),
      accessToken: 'to-clear',
      refreshToken: 'to-clear',
      isAuthenticated: true,
      isLoading: false,
    };
    const state = reducer(authenticatedState, logout());

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
