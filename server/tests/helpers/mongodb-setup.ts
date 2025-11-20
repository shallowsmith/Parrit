/**
 * MongoDB Test Setup Utilities
 *
 * Provides utilities for setting up and tearing down MongoDB Memory Server
 * for integration tests.
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import DatabaseConnection from '../../src/config/database';

let mongoServer: MongoMemoryServer | null = null;

/**
 * Starts MongoDB Memory Server and connects the database
 * Call this in beforeAll() for integration tests
 */
export async function setupDatabase(): Promise<void> {
  try {
    // Create and start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.0', // Match your MongoDB version
      },
    });

    const mongoUri = mongoServer.getUri();

    // Connect database singleton to in-memory MongoDB
    await DatabaseConnection.getInstance().connect(mongoUri);

    console.log('✓ MongoDB Memory Server started and connected');
  } catch (error) {
    console.error('Failed to setup MongoDB Memory Server:', error);
    throw error;
  }
}

/**
 * Disconnects database and stops MongoDB Memory Server
 * Call this in afterAll() for integration tests
 */
export async function teardownDatabase(): Promise<void> {
  try {
    // Disconnect database
    await DatabaseConnection.getInstance().disconnect();

    // Stop MongoDB Memory Server
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }

    console.log('✓ MongoDB Memory Server stopped and disconnected');
  } catch (error) {
    console.error('Failed to teardown MongoDB Memory Server:', error);
    throw error;
  }
}

/**
 * Clears all collections in the database
 * Call this in afterEach() or beforeEach() to isolate tests
 */
export async function clearDatabase(): Promise<void> {
  try {
    const db = DatabaseConnection.getInstance().getDatabase();
    const collections = await db.collections();

    // Delete all documents from all collections
    for (const collection of collections) {
      await collection.deleteMany({});
    }

    console.log('✓ Database cleared');
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
}

/**
 * Seeds the database with test data
 * Useful for integration tests that need specific data setup
 */
export async function seedDatabase(data: {
  collection: string;
  documents: any[];
}[]): Promise<void> {
  try {
    const db = DatabaseConnection.getInstance().getDatabase();

    for (const { collection, documents } of data) {
      if (documents.length > 0) {
        await db.collection(collection).insertMany(documents);
      }
    }

    console.log('✓ Database seeded with test data');
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  }
}
