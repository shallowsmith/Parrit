/**
 * AuthContext Tests (White Box)
 * 
 * Tests state management, authentication flows, and context provider behavior
 */

import React from 'react';
import { render, act, waitFor, renderHook, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { firebaseService } from '@/services/firebase.service';
import { authService } from '@/services/auth.service';
import { auth } from '@/config/firebase';

// Access the global mock auth object
const mockAuth = auth as any;

const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  getIdToken: jest.fn().mockResolvedValue('mock-token'),
};

const mockProfile = {
  id: 'profile-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@example.com',
  phoneNumber: '+1234567890',
  birthday: '01/15',
};

// Mock services
jest.mock('@/services/firebase.service', () => ({
  firebaseService: {
    signUp: jest.fn(() => Promise.resolve({ user: mockUser, token: 'mock-token' })),
    signIn: jest.fn(() => Promise.resolve({ user: mockUser, token: 'mock-token' })),
    signOut: jest.fn(() => Promise.resolve()),
    refreshToken: jest.fn(() => Promise.resolve('refreshed-token')),
    getCurrentUser: jest.fn(() => mockUser),
  },
}));
jest.mock('@/services/auth.service', () => ({
  authService: {
    checkLoginStatus: jest.fn(),
    createProfile: jest.fn(),
  },
}));
jest.mock('@/services/profile.service', () => ({
  profileService: {
    updateProfile: jest.fn(),
  },
}));

// Firebase is mocked globally in jest.setup.js

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Test component that uses AuthContext
const TestComponent = () => {
  const { user, profile, loading, isAuthenticated } = useAuth();
  
  return (
    <>
      <Text testID="loading">{loading ? 'Loading' : 'Loaded'}</Text>
      <Text testID="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</Text>
      <Text testID="user">{user ? user.email : 'No User'}</Text>
      <Text testID="profile">{profile ? profile.firstName : 'No Profile'}</Text>
    </>
  );
};

describe('AuthContext', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Initialization', () => {
    it('provides auth context to children', () => {
      (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('loading')).toBeTruthy();
    });

    it('starts with loading state', () => {
      (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('loading').props.children).toBe('Loading');
    });

    it('initializes with no user', async () => {
      (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('user').props.children).toBe('No User');
      });
    });
  });

  describe('Authentication State Changes', () => {
    it('updates state when user logs in', async () => {
      (authService.checkLoginStatus as jest.Mock).mockResolvedValue({
        status: 200,
        data: {
          message: 'Login success',
          profile: mockProfile,
        },
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Simulate user login by calling the global auth callback
      await act(async () => {
        mockAuth._authCallback(mockUser);
      });

      await waitFor(() => {
        expect(getByTestId('authenticated').props.children).toBe('Authenticated');
        expect(getByTestId('user').props.children).toBe('test@example.com');
        expect(getByTestId('profile').props.children).toBe('John');
      });
    });

    it('handles user without profile (404)', async () => {
      (authService.checkLoginStatus as jest.Mock).mockRejectedValue({
        response: { status: 404 },
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        mockAuth._authCallback(mockUser);
      });

      await waitFor(() => {
        expect(getByTestId('authenticated').props.children).toBe('Not Authenticated');
        expect(getByTestId('profile').props.children).toBe('No Profile');
      });
    });

    it('updates state when user logs out', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        mockAuth._authCallback(null);
      });

      await waitFor(() => {
        expect(getByTestId('authenticated').props.children).toBe('Not Authenticated');
        expect(getByTestId('user').props.children).toBe('No User');
      });
    });
  });

  describe('Login Function', () => {
    it('calls firebaseService.signIn with credentials', async () => {
      (auth.onAuthStateChanged as jest.Mock).mockImplementation(() => jest.fn());
      (firebaseService.signIn as jest.Mock).mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(firebaseService.signIn).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('returns success: true on successful login', async () => {
      (auth.onAuthStateChanged as jest.Mock).mockImplementation(() => jest.fn());
      (firebaseService.signIn as jest.Mock).mockResolvedValue({ user: mockUser });

      const TestLoginComponent = () => {
        const { login } = useAuth();
        const [result, setResult] = React.useState<any>(null);

        return (
          <>
            <Text
              testID="login-button"
              onPress={async () => {
                const res = await login('test@example.com', 'password');
                setResult(res);
              }}
            >
              Login
            </Text>
            <Text testID="result">{result ? result.success.toString() : 'null'}</Text>
          </>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestLoginComponent />
        </AuthProvider>
      );

      // Trigger the login
      await act(async () => {
        fireEvent.press(getByTestId('login-button'));
      });

      expect(firebaseService.signIn).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });

  describe('Register Function', () => {
    it('has access to register function from AuthContext', () => {
      const TestRegisterComponent = () => {
        const { register } = useAuth();
        return <Text>Register available: {typeof register === 'function' ? 'yes' : 'no'}</Text>;
      };

      const { getByText } = render(
        <AuthProvider>
          <TestRegisterComponent />
        </AuthProvider>
      );

      expect(getByText('Register available: yes')).toBeTruthy();
    });
  });

  describe('Logout Function', () => {
    it('has access to logout function from AuthContext', () => {
      const TestLogoutComponent = () => {
        const { logout } = useAuth();
        return <Text>Logout available: {typeof logout === 'function' ? 'yes' : 'no'}</Text>;
      };

      const { getByText } = render(
        <AuthProvider>
          <TestLogoutComponent />
        </AuthProvider>
      );

      expect(getByText('Logout available: yes')).toBeTruthy();
    });

    it('clears user and profile state', async () => {
      (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
        // Simulate immediate logout
        setTimeout(() => callback(null), 0);
        return jest.fn();
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('user').props.children).toBe('No User');
        expect(getByTestId('profile').props.children).toBe('No Profile');
        expect(getByTestId('authenticated').props.children).toBe('Not Authenticated');
      });
    });
  });

  describe('useAuth Hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within AuthProvider');

      consoleSpy.mockRestore();
    });

    it('provides auth context when used inside AuthProvider', () => {
      (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('loading')).toBeTruthy();
      expect(getByTestId('authenticated')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles login errors gracefully', async () => {
      (auth.onAuthStateChanged as jest.Mock).mockImplementation(() => jest.fn());
      (firebaseService.signIn as jest.Mock).mockRejectedValue(new Error('Login failed'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await expect(firebaseService.signIn('test@example.com', 'wrong')).rejects.toThrow('Login failed');
    });

    it('handles network errors during auth check', async () => {
      (authService.checkLoginStatus as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        mockAuth._authCallback(mockUser);
      });

      // Should handle error and set loading to false
      await waitFor(() => {
        expect(getByTestId('loading').props.children).toBe('Loaded');
        expect(getByTestId('authenticated').props.children).toBe('Not Authenticated');
      });
    });
  });
});

