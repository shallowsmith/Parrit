import { MongoClient, Db } from 'mongodb';

/**
 * Singleton class for managing MongoDB database connections.
 * Ensures only one connection instance exists throughout the application lifecycle.
 *
 * This pattern provides:
 * - Centralized connection management
 * - Connection reuse across the application
 * - Graceful connection handling and cleanup
 */
class DatabaseConnection {
  // Single instance of the DatabaseConnection class (Singleton pattern)
  private static instance: DatabaseConnection;

  // MongoDB client instance for managing connections
  private client: MongoClient | null = null;

  // Database instance for performing operations
  private db: Db | null = null;

  /**
   * Private constructor prevents direct instantiation.
   * Use getInstance() to get the singleton instance.
   */
  private constructor() {}

  /**
   * Gets the singleton instance of DatabaseConnection.
   * Creates the instance if it doesn't exist (lazy initialization).
   *
   * @returns {DatabaseConnection} The singleton instance
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Establishes connection to MongoDB.
   * Uses environment variables for configuration with fallback defaults.
   *
   * @throws {Error} If connection fails
   */
  public async connect(): Promise<void> {
    try {
      // Skip if already connected
      if (this.client) {
        return;
      }

      // Get connection string from environment or use local default
      const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      const databaseName = process.env.DATABASE_NAME || 'parrit';

      // Create and connect the MongoDB client
      this.client = new MongoClient(connectionString);
      await this.client.connect();

      // Select the database (creates it if doesn't exist)
      this.db = this.client.db(databaseName);

      console.log(`Connected to MongoDB database: ${databaseName}`);
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Closes the MongoDB connection.
   * Should be called during application shutdown for cleanup.
   *
   * @throws {Error} If disconnection fails
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        console.log('Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('Failed to disconnect from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Gets the current database instance.
   * Used by repositories to access collections.
   *
   * @returns {Db} The MongoDB database instance
   * @throws {Error} If database is not connected
   */
  public getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Gets the MongoDB client instance.
   * Useful for advanced operations requiring direct client access.
   *
   * @returns {MongoClient} The MongoDB client instance
   * @throws {Error} If client is not connected
   */
  public getClient(): MongoClient {
    if (!this.client) {
      throw new Error('Database client not connected. Call connect() first.');
    }
    return this.client;
  }
}

export default DatabaseConnection;