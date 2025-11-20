/**
 * Profile Routes Integration Tests
 *
 * Tests the API endpoints with real HTTP requests and MongoDB Memory Server
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import profileRoutes from '../../src/routes/profile.routes';
import { setupDatabase, teardownDatabase, clearDatabase } from '../helpers/mongodb-setup';
import { mockTokens } from '../helpers/firebase-mocks';
import { createTestProfile } from '../helpers/test-data';

// Mock Firebase Admin SDK at module level
vi.mock('../../src/config/firebase-admin', () => ({
  verifyIdToken: vi.fn(),
  setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
}));

import { verifyIdToken } from '../../src/config/firebase-admin';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/profiles', profileRoutes);

// Add login endpoint for testing
app.post('/api/v1/login', (req, res) => {
  res.status(404).json({
    error: 'User not found',
    message: 'First time login',
    firebaseUid: 'test-firebase-uid',
  });
});

describe('Profile API Integration Tests', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
    vi.clearAllMocks();
  });

  describe('POST /api/v1/profiles', () => {
    it('should create a new profile with valid data', async () => {
      // Arrange
      const profileData = createTestProfile();
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithoutUserId);

      // Act
      const response = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profileData)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe(profileData.firstName);
      expect(response.body.email).toBe(profileData.email.toLowerCase());
      expect(response.body.firebaseUid).toBe(mockTokens.validWithoutUserId.uid);
    });

    it('should reject profile creation without authentication token', async () => {
      // Arrange
      const profileData = createTestProfile();

      // Act
      const response = await request(app)
        .post('/api/v1/profiles')
        .send(profileData)
        .expect(401);

      // Assert
      expect(response.body.error).toBe('No token provided');
    });

    it('should reject profile creation with invalid token', async () => {
      // Arrange
      const profileData = createTestProfile();
      (verifyIdToken as any).mockRejectedValue({
        code: 'auth/invalid-id-token',
        message: 'Invalid token',
      });

      // Act
      const response = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer invalid-token')
        .send(profileData)
        .expect(401);

      // Assert
      expect(response.body.error).toBe('Invalid token');
    });

    it('should reject profile with missing required fields', async () => {
      // Arrange
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithoutUserId);
      const incompleteData = {
        firstName: 'John',
        // Missing lastName, birthday, email, phoneNumber
      };

      // Act
      const response = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(incompleteData)
        .expect(400);

      // Assert
      expect(response.body.error).toBeDefined();
    });

    it('should reject profile with invalid email format', async () => {
      // Arrange
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithoutUserId);
      const profileData = createTestProfile({ email: 'invalid-email' });

      // Act
      const response = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profileData)
        .expect(400);

      // Assert
      expect(response.body.error).toBeDefined();
    });

    it('should reject duplicate email addresses', async () => {
      // Arrange
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithoutUserId);
      const profileData = createTestProfile();

      // Create first profile
      await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profileData)
        .expect(201);

      // Try to create second profile with same email
      const duplicateData = createTestProfile({ email: profileData.email });
      (verifyIdToken as any).mockResolvedValue({
        uid: 'different-firebase-uid',
        email: duplicateData.email,
      });

      // Act
      const response = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token-2')
        .send(duplicateData)
        .expect(409);

      // Assert
      expect(response.body.error).toContain('already exists');
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithoutUserId);
      const profileData = createTestProfile({ email: 'TEST@EXAMPLE.COM' });

      // Act
      const response = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profileData)
        .expect(201);

      // Assert
      expect(response.body.email).toBe('test@example.com');
    });
  });

  describe('GET /api/v1/profiles/:id', () => {
    it('should retrieve a profile by ID', async () => {
      // Arrange - Create a profile first
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithoutUserId);
      const profileData = createTestProfile();

      const createResponse = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profileData);

      const profileId = createResponse.body.id;

      // Mock token with userId for authorization
      (verifyIdToken as any).mockResolvedValue({
        ...mockTokens.validWithUserId,
        userId: profileId,
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/profiles/${profileId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Assert
      expect(response.body.id).toBe(profileId);
      expect(response.body.firstName).toBe(profileData.firstName);
      expect(response.body.email).toBe(profileData.email.toLowerCase());
    });

    it('should return 404 for non-existent profile', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id-123';
      (verifyIdToken as any).mockResolvedValue({
        ...mockTokens.validWithUserId,
        userId: nonExistentId,
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/profiles/${nonExistentId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      // Assert
      expect(response.body.error).toBe('Profile not found');
    });

    it('should reject access without authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/profiles/some-id')
        .expect(401);

      // Assert
      expect(response.body.error).toBe('No token provided');
    });

    it('should reject access to another user\'s profile', async () => {
      // Arrange - Create a profile
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithoutUserId);
      const profileData = createTestProfile();

      const createResponse = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profileData);

      const profileId = createResponse.body.id;

      // Try to access with different userId in token
      (verifyIdToken as any).mockResolvedValue({
        ...mockTokens.differentUser,
        userId: 'different-user-id',
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/profiles/${profileId}`)
        .set('Authorization', 'Bearer different-token')
        .expect(401);

      // Assert
      expect(response.body.error).toBe('Unauthorized access');
    });
  });

  describe('PUT /api/v1/profiles/:id', () => {
    it('should update a profile with valid data', async () => {
      // Arrange - Create a profile first
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithoutUserId);
      const profileData = createTestProfile();

      const createResponse = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profileData);

      const profileId = createResponse.body.id;

      // Mock token with userId for authorization
      (verifyIdToken as any).mockResolvedValue({
        ...mockTokens.validWithUserId,
        userId: profileId,
      });

      const updateData = {
        firstName: 'Jane',
        phoneNumber: '+0987654321',
      };

      // Act
      const response = await request(app)
        .put(`/api/v1/profiles/${profileId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.firstName).toBe('Jane');
      expect(response.body.phoneNumber).toBe('+0987654321');
      expect(response.body.lastName).toBe(profileData.lastName); // Unchanged
    });

    it('should reject update without authentication', async () => {
      // Act
      const response = await request(app)
        .put('/api/v1/profiles/some-id')
        .send({ firstName: 'Jane' })
        .expect(401);

      // Assert
      expect(response.body.error).toBe('No token provided');
    });

    it('should reject update to another user\'s profile', async () => {
      // Arrange - Create a profile
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithoutUserId);
      const profileData = createTestProfile();

      const createResponse = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profileData);

      const profileId = createResponse.body.id;

      // Try to update with different userId in token
      (verifyIdToken as any).mockResolvedValue({
        ...mockTokens.differentUser,
        userId: 'different-user-id',
      });

      // Act
      const response = await request(app)
        .put(`/api/v1/profiles/${profileId}`)
        .set('Authorization', 'Bearer different-token')
        .send({ firstName: 'Hacker' })
        .expect(401);

      // Assert
      expect(response.body.error).toBe('Unauthorized access');
    });
  });

  describe('GET /api/v1/profiles', () => {
    it('should retrieve all profiles', async () => {
      // Arrange - Create multiple profiles
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithoutUserId);

      const profile1 = createTestProfile();
      const profile2 = createTestProfile();

      await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token')
        .send(profile1);

      (verifyIdToken as any).mockResolvedValue({
        uid: 'different-firebase-uid',
        email: profile2.email,
      });

      await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token-2')
        .send(profile2);

      // Mock token for list access
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithUserId);

      // Act
      const response = await request(app)
        .get('/api/v1/profiles')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject access without authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/profiles')
        .expect(401);

      // Assert
      expect(response.body.error).toBe('No token provided');
    });
  });
});
