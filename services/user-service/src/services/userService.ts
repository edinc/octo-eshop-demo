import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/userRepository';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { AuthTokens } from '@octo-eshop/types';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async register(input: RegisterInput): Promise<{ id: string; email: string }> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const tokens = generateTokens({ userId: user.id, email: user.email });
    await this.userRepository.createSession(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.userRepository.deleteSession(refreshToken);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...profile } = user;
    return profile;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async updateProfile(userId: string, data: { firstName?: string; lastName?: string }) {
    const updateData: { firstName?: string; lastName?: string } = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    const user = await this.userRepository.update(userId, updateData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...profile } = user;
    return profile;
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);
    const session = await this.userRepository.findSession(refreshToken);

    if (!session || session.expiresAt < new Date()) {
      throw new Error('Invalid refresh token');
    }

    await this.userRepository.deleteSession(refreshToken);
    const tokens = generateTokens({ userId: payload.userId, email: payload.email });
    await this.userRepository.createSession(payload.userId, tokens.refreshToken);

    return tokens;
  }
}
