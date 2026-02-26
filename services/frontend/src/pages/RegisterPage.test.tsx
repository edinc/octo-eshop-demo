import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';

const navigate = vi.fn();

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
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

describe('RegisterPage', () => {
  const registerUser = vi.fn();
  let formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    formData = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    };

    mockedUseAuth.mockReturnValue({
      register: registerUser,
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

  it('strips confirmPassword and navigates home on success', async () => {
    registerUser.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(registerUser).toHaveBeenCalledWith({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'Password1',
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows API error message when registration fails', async () => {
    registerUser.mockResolvedValue({ success: false, error: { message: 'Email already in use' } });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(await screen.findByText('Email already in use')).toBeInTheDocument();
  });
});
