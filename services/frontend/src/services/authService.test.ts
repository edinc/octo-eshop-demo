import { beforeEach, describe, expect, it, vi } from 'vitest';
import authService from './authService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

type ApiMock = {
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

const mockedApi = api as unknown as ApiMock;

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls login, register and refresh endpoints', async () => {
    mockedApi.post.mockResolvedValue({ data: { success: true, data: {} } });

    await authService.login({ email: 'user@example.com', password: 'Password1' });
    await authService.register({
      email: 'user@example.com',
      password: 'Password1',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    await authService.refreshToken('refresh-token');

    expect(mockedApi.post).toHaveBeenNthCalledWith(1, '/auth/login', {
      email: 'user@example.com',
      password: 'Password1',
    });
    expect(mockedApi.post).toHaveBeenNthCalledWith(2, '/auth/register', {
      email: 'user@example.com',
      password: 'Password1',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    expect(mockedApi.post).toHaveBeenNthCalledWith(3, '/auth/refresh', {
      refreshToken: 'refresh-token',
    });
  });

  it('calls profile read/update endpoints', async () => {
    mockedApi.get.mockResolvedValue({ data: { success: true, data: {} } });
    mockedApi.put.mockResolvedValue({ data: { success: true, data: {} } });

    await authService.getProfile();
    await authService.updateProfile({ firstName: 'Updated' });

    expect(mockedApi.get).toHaveBeenCalledWith('/users/me');
    expect(mockedApi.put).toHaveBeenCalledWith('/users/me', { firstName: 'Updated' });
  });

  it('clears tokens on logout even when API request fails', async () => {
    localStorage.setItem('accessToken', 'a');
    localStorage.setItem('refreshToken', 'r');
    mockedApi.post.mockRejectedValue(new Error('logout failed'));

    await expect(authService.logout()).rejects.toThrow('logout failed');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
