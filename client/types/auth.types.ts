/**
 * Authentication Type Definitions
 *
 * TypeScript interfaces for authentication-related data structures.
 */

export interface Profile {
  id: string;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  birthday: string; // MM/DD format
  email: string;
  phoneNumber: string;
  profileImage?: string;
  nickname?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthState {
  user: any | null; // Firebase User object
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthday: string;
  phoneNumber: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}
