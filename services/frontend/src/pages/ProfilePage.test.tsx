import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import { useAuth } from '@/hooks/useAuth';

const navigate = vi.fn();

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

describe('ProfilePage', () => {
  const logout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login when profile is not available', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout,
    });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('renders profile details and wires actions', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      logout,
      user: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        createdAt: new Date('2024-01-01'),
      },
    });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();

    fireEvent.click(screen.getByText('View Orders'));
    expect(navigate).toHaveBeenCalledWith('/orders');

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
    expect(logout).toHaveBeenCalledOnce();
  });
});
