import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';

const navigate = vi.fn();
let redirectParam = '/checkout';

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
    useSearchParams: () => [new URLSearchParams(`redirect=${encodeURIComponent(redirectParam)}`)],
  };
});

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(),
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockedUseForm = useForm as unknown as ReturnType<typeof vi.fn>;

describe('LoginPage', () => {
  const login = vi.fn();
  let formData: { email: string; password: string };

  beforeEach(() => {
    vi.clearAllMocks();
    redirectParam = '/checkout';
    formData = { email: 'jane@example.com', password: 'Password1' };

    mockedUseAuth.mockReturnValue({
      login,
      isLoading: false,
    });

    mockedUseForm.mockReturnValue({
      register: vi.fn(() => ({})),
      handleSubmit: (cb: (data: typeof formData) => Promise<void>) => async (e?: Event) => {
        e?.preventDefault?.();
        await cb(formData);
      },
      formState: { errors: {} },
    });
  });

  it('navigates to validated redirect on successful login', async () => {
    login.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(login).toHaveBeenCalledWith(formData);
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/checkout');
    });
  });

  it('falls back to root for unsafe redirect values', async () => {
    redirectParam = '//evil.test';
    login.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error message on failed login response', async () => {
    login.mockResolvedValue({ success: false, error: { message: 'Invalid credentials' } });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
