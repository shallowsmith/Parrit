/**
 * Auth Service Tests (White Box)
 * 
 * Tests API calls and data handling in the auth service
 */

import { authService } from '@/services/auth.service';
import api from '@/services/api';

// Mock the api module
jest.mock('@/services/api');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkLoginStatus', () => {
    it('calls POST /profiles/login endpoint', async () => {
      const mockResponse = {
        data: {
          message: 'Login success',
          profile: {
            id: '123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        status: 200,
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.checkLoginStatus();

      expect(api.post).toHaveBeenCalledWith('/profiles/login');
      expect(result.data.message).toBe('Login success');
      expect(result.data.profile.firstName).toBe('John');
    });

    it('returns profile data on successful login', async () => {
      const mockProfile = {
        id: '123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      };

      (api.post as jest.Mock).mockResolvedValue({
        data: { message: 'Login success', profile: mockProfile },
        status: 200,
      });

      const result = await authService.checkLoginStatus();

      expect(result.data.profile).toEqual(mockProfile);
    });

    it('handles 404 response for first-time users', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            error: 'User not found',
            message: 'First time login',
          },
        },
      };

      (api.post as jest.Mock).mockRejectedValue(mockError);

      await expect(authService.checkLoginStatus()).rejects.toEqual(mockError);
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network request failed');
      (api.post as jest.Mock).mockRejectedValue(networkError);

      await expect(authService.checkLoginStatus()).rejects.toThrow('Network request failed');
    });
  });

  describe('createProfile', () => {
    const validProfileData = {
      firstName: 'John',
      lastName: 'Doe',
      birthday: '01/15',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
    };

    it('calls POST /profiles endpoint with profile data', async () => {
      const mockResponse = {
        data: {
          id: '123',
          ...validProfileData,
        },
        status: 201,
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.createProfile(validProfileData);

      expect(api.post).toHaveBeenCalledWith('/profiles', validProfileData);
      expect(result.data.id).toBe('123');
      expect(result.data.firstName).toBe('John');
    });

    it('returns created profile with id', async () => {
      const mockCreatedProfile = {
        id: 'new-profile-id',
        ...validProfileData,
        createdAt: '2025-01-01T00:00:00Z',
      };

      (api.post as jest.Mock).mockResolvedValue({
        data: mockCreatedProfile,
        status: 201,
      });

      const result = await authService.createProfile(validProfileData);

      expect(result.data.id).toBe('new-profile-id');
      expect(result.data.firstName).toBe(validProfileData.firstName);
      expect(result.data.email).toBe(validProfileData.email);
    });

    it('handles validation errors', async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            error: 'Validation failed',
            details: ['Email is required'],
          },
        },
      };

      (api.post as jest.Mock).mockRejectedValue(validationError);

      await expect(authService.createProfile(validProfileData)).rejects.toEqual(validationError);
    });

    it('handles duplicate email errors', async () => {
      const duplicateError = {
        response: {
          status: 409,
          data: {
            error: 'Email already exists',
          },
        },
      };

      (api.post as jest.Mock).mockRejectedValue(duplicateError);

      await expect(authService.createProfile(validProfileData)).rejects.toEqual(duplicateError);
    });

    it('sends all required fields', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: { id: '123', ...validProfileData },
        status: 201,
      });

      await authService.createProfile(validProfileData);

      const callArgs = (api.post as jest.Mock).mock.calls[0][1];
      expect(callArgs).toHaveProperty('firstName');
      expect(callArgs).toHaveProperty('lastName');
      expect(callArgs).toHaveProperty('birthday');
      expect(callArgs).toHaveProperty('email');
      expect(callArgs).toHaveProperty('phoneNumber');
    });
  });

  describe('getProfile', () => {
    it('calls GET /profiles/:userId endpoint', async () => {
      const userId = 'user-123';
      const mockProfile = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      (api.get as jest.Mock).mockResolvedValue({
        data: mockProfile,
        status: 200,
      });

      const result = await authService.getProfile(userId);

      expect(api.get).toHaveBeenCalledWith(`/profiles/${userId}`);
      expect(result.data.id).toBe(userId);
    });

    it('returns profile data for valid userId', async () => {
      const userId = 'valid-user-id';
      const mockProfile = {
        id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phoneNumber: '+1987654321',
        birthday: '02/20',
      };

      (api.get as jest.Mock).mockResolvedValue({
        data: mockProfile,
        status: 200,
      });

      const result = await authService.getProfile(userId);

      expect(result.data).toEqual(mockProfile);
    });

    it('handles 404 for non-existent user', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: {
            error: 'Profile not found',
          },
        },
      };

      (api.get as jest.Mock).mockRejectedValue(notFoundError);

      await expect(authService.getProfile('non-existent-id')).rejects.toEqual(notFoundError);
    });

    it('handles unauthorized access', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: {
            error: 'Unauthorized access',
          },
        },
      };

      (api.get as jest.Mock).mockRejectedValue(unauthorizedError);

      await expect(authService.getProfile('other-user-id')).rejects.toEqual(unauthorizedError);
    });
  });

  describe('Error Handling', () => {
    it('propagates API errors correctly', async () => {
      const apiError = new Error('API Error');
      (api.post as jest.Mock).mockRejectedValue(apiError);

      await expect(authService.checkLoginStatus()).rejects.toThrow('API Error');
    });

    it('handles timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };

      (api.post as jest.Mock).mockRejectedValue(timeoutError);

      await expect(authService.checkLoginStatus()).rejects.toEqual(timeoutError);
    });
  });
});

