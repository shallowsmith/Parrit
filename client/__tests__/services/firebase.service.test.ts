/**
 * Firebase Service Tests (White Box)
 *
 * Tests Firebase authentication operations and token management
 */

import { firebaseService } from '@/services/firebase.service';
import { auth } from '@/config/firebase';

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

// Import the mocked functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  getIdToken: jest.fn(),
};

const mockUserCredential = {
  user: mockUser,
};

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth mock
    (auth as any).currentUser = null;
    mockUser.getIdToken.mockResolvedValue('mock-token');
  });

  describe('signUp', () => {
    it('creates user with email and password successfully', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const result = await firebaseService.signUp('test@example.com', 'password123');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
      expect(mockUser.getIdToken).toHaveBeenCalledWith();
      expect(result).toEqual({
        user: mockUser,
        token: 'mock-token',
      });
    });

    it('throws error when user creation fails', async () => {
      const error = new Error('Email already in use');
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(firebaseService.signUp('test@example.com', 'password123'))
        .rejects.toThrow('Email already in use');
    });

    it('handles weak password error', async () => {
      const error = new Error('Password should be at least 6 characters');
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(firebaseService.signUp('test@example.com', '123'))
        .rejects.toThrow('Password should be at least 6 characters');
    });
  });

  describe('signIn', () => {
    it('signs in user with email and password successfully', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const result = await firebaseService.signIn('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
      expect(mockUser.getIdToken).toHaveBeenCalledWith();
      expect(result).toEqual({
        user: mockUser,
        token: 'mock-token',
      });
    });

    it('throws error when sign in fails', async () => {
      const error = new Error('Invalid credentials');
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(firebaseService.signIn('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('handles user not found error', async () => {
      const error = new Error('User not found');
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(firebaseService.signIn('nonexistent@example.com', 'password123'))
        .rejects.toThrow('User not found');
    });
  });

  describe('signOut', () => {
    it('calls Firebase signOut successfully', async () => {
      (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);

      await expect(firebaseService.signOut()).resolves.toBeUndefined();
      expect(firebaseSignOut).toHaveBeenCalledWith(auth);
    });

    it('handles sign out errors', async () => {
      const error = new Error('Sign out failed');
      (firebaseSignOut as jest.Mock).mockRejectedValue(error);

      await expect(firebaseService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('refreshToken', () => {
    it('refreshes token when user is authenticated', async () => {
      (auth as any).currentUser = mockUser;
      mockUser.getIdToken.mockResolvedValue('refreshed-token');

      const result = await firebaseService.refreshToken();

      expect(mockUser.getIdToken).toHaveBeenCalledWith(false);
      expect(result).toBe('refreshed-token');
    });

    it('refreshes token with force refresh when specified', async () => {
      (auth as any).currentUser = mockUser;
      mockUser.getIdToken.mockResolvedValue('force-refreshed-token');

      const result = await firebaseService.refreshToken(true);

      expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
      expect(result).toBe('force-refreshed-token');
    });

    it('returns null when no user is authenticated', async () => {
      (auth as any).currentUser = null;

      const result = await firebaseService.refreshToken();

      expect(result).toBeNull();
      expect(mockUser.getIdToken).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('returns current authenticated user', () => {
      (auth as any).currentUser = mockUser;

      const result = firebaseService.getCurrentUser();

      expect(result).toBe(mockUser);
    });

    it('returns null when no user is authenticated', () => {
      (auth as any).currentUser = null;

      const result = firebaseService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
