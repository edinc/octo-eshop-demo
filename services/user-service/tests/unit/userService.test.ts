import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../../src/services/userService';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: {
    findByEmail: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    createSession: ReturnType<typeof vi.fn>;
    deleteSession: ReturnType<typeof vi.fn>;
    findSession: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      createSession: vi.fn(),
      deleteSession: vi.fn(),
      findSession: vi.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userService = new UserService(mockUserRepository as any);
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      });

      const result = await userService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toEqual({ id: '123', email: 'test@example.com' });
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({ id: '123' });

      await expect(
        userService.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow('User already exists');
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      mockUserRepository.findById.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await userService.getProfile('123');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getProfile('123')).rejects.toThrow('User not found');
    });
  });
});
