/**
 * Firebase Sign-Up Script
 *
 * Creates a new Firebase user with email and password, then returns the JWT ID token.
 * Useful for testing the complete registration flow during development.
 *
 * Usage:
 *   node scripts/firebase-signup.js <email> <password>
 *   npm run firebase-signup <email> <password>
 *
 * Example:
 *   node scripts/firebase-signup.js newuser@example.com SecurePass123
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase client configuration (same as login script)
const firebaseConfig = {
  apiKey: "AIzaSyCw-vzSeGGn0Xb76Ag_tz1lHmMVEp5zLRs",
  authDomain: "parrit-fc705.firebaseapp.com",
  projectId: "parrit-fc705",
  storageBucket: "parrit-fc705.firebasestorage.app",
  messagingSenderId: "837818695525",
  appId: "1:837818695525:web:7f4a9d0d6839334a346b8c",
  measurementId: "G-Z9ND7P9V0Y"
};

/**
 * Formats a timestamp into a readable date string
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toUTCString();
}

/**
 * Calculates time remaining until token expiration
 */
function getTimeRemaining(expirationTime) {
  const now = Date.now();
  const diff = expirationTime - now;

  if (diff <= 0) {
    return 'Expired';
  }

  const minutes = Math.floor(diff / 1000 / 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

/**
 * Initialize Firebase Admin SDK for token verification
 */
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return; // Already initialized
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    console.error('❌ Error: FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    console.error('   Please add your Firebase service account JSON to .env file\n');
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('❌ Error: Failed to parse FIREBASE_SERVICE_ACCOUNT');
    console.error('   Make sure the JSON is valid\n');
    process.exit(1);
  }
}

/**
 * Main sign-up function
 */
async function signUpUser(email, password) {
  try {
    console.log('\n🔐 Firebase User Sign-Up');
    console.log('========================\n');

    // Initialize Firebase Client SDK
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Initialize Firebase Admin SDK (for token verification)
    initializeFirebaseAdmin();

    console.log('📧 Email:', email);
    console.log('🔄 Creating user...\n');

    // Create user with Firebase Client SDK
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get ID token
    const idToken = await user.getIdToken();

    // Get ID token result with claims
    const idTokenResult = await user.getIdTokenResult();

    console.log('✅ User created successfully!\n');

    // Display user information
    console.log('📋 User Details:');
    console.log(`   Firebase UID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Created At: ${formatDate(user.metadata.creationTime)}`);

    // Display JWT token
    console.log('\n🎫 JWT ID Token (valid for 1 hour):');
    console.log(`   ${idToken}`);

    // Verify and decode token using Admin SDK
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      console.log('\n📦 Token Payload:');
      console.log(`   uid: ${decodedToken.uid}`);
      console.log(`   email: ${decodedToken.email}`);
      console.log(`   email_verified: ${decodedToken.email_verified}`);
      console.log(`   userId: ${decodedToken.userId || '(not set - first time user)'}`);

      const expirationTime = new Date(decodedToken.exp * 1000).getTime();
      console.log('\n⏰ Token Expiration:');
      console.log(`   Expires at: ${formatDate(expirationTime)}`);
      console.log(`   Expires in: ${getTimeRemaining(expirationTime)}`);
    } catch (error) {
      console.error('⚠️  Warning: Could not verify token with Admin SDK:', error.message);
    }

    // Display custom claims status
    console.log('\n🔑 Custom Claims:');
    const customClaims = Object.entries(idTokenResult.claims)
      .filter(([key]) => !['iss', 'aud', 'auth_time', 'user_id', 'sub', 'iat', 'exp', 'email', 'email_verified', 'firebase'].includes(key));

    if (customClaims.length > 0) {
      customClaims.forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    } else {
      console.log('   No custom claims set yet (expected for new users)');
      console.log('   Custom claims will be added after profile creation');
    }

    // Next steps instructions
    console.log('\n💡 Next Steps:');
    console.log('   1️⃣  Test login endpoint (should return 404 "First time login"):');
    console.log('      curl -X POST http://localhost:3000/api/v1/login \\');
    console.log('        -H "Authorization: Bearer <token>"\n');

    console.log('   2️⃣  Create profile with the token:');
    console.log('      curl -X POST http://localhost:3000/api/v1/profiles \\');
    console.log('        -H "Authorization: Bearer <token>" \\');
    console.log('        -H "Content-Type: application/json" \\');
    console.log('        -d \'{\n' +
                '          "firstName": "John",\n' +
                '          "lastName": "Doe",\n' +
                '          "birthday": "01/15",\n' +
                '          "email": "' + email + '",\n' +
                '          "phoneNumber": "+1234567890"\n' +
                '        }\'\n');

    console.log('   3️⃣  Login again to get token with userId custom claim:');
    console.log('      npm run firebase-login ' + email + ' <password>\n');

    console.log('   4️⃣  Test login endpoint again (should return 200 "Login success"):');
    console.log('      curl -X POST http://localhost:3000/api/v1/login \\');
    console.log('        -H "Authorization: Bearer <new-token>"\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Sign-up failed!\n');

    if (error.code === 'auth/email-already-in-use') {
      console.error('   Error: Email is already registered');
      console.error('   💡 Try logging in instead:');
      console.error('      npm run firebase-login ' + email + ' <password>\n');
    } else if (error.code === 'auth/invalid-email') {
      console.error('   Error: Invalid email format');
      console.error('   Please provide a valid email address\n');
    } else if (error.code === 'auth/weak-password') {
      console.error('   Error: Password is too weak');
      console.error('   Password must be at least 6 characters\n');
    } else if (error.code === 'auth/network-request-failed') {
      console.error('   Error: Network error');
      console.error('   Please check your internet connection\n');
    } else {
      console.error('   Error:', error.message);
      console.error('   Code:', error.code || 'unknown');
      console.error('');
    }

    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('\n❌ Error: Missing required arguments\n');
    console.error('Usage:');
    console.error('  node scripts/firebase-signup.js <email> <password>');
    console.error('  npm run firebase-signup <email> <password>\n');
    console.error('Example:');
    console.error('  node scripts/firebase-signup.js newuser@example.com SecurePass123\n');
    console.error('Notes:');
    console.error('  - Email must be a valid email format');
    console.error('  - Password must be at least 6 characters (Firebase requirement)\n');
    process.exit(1);
  }

  const [email, password] = args;

  // Validate email format (basic check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('\n❌ Error: Invalid email format');
    console.error('   Please provide a valid email address\n');
    process.exit(1);
  }

  // Validate password length (Firebase minimum)
  if (password.length < 6) {
    console.error('\n❌ Error: Password too short');
    console.error('   Password must be at least 6 characters (Firebase requirement)\n');
    process.exit(1);
  }

  // Perform sign-up
  await signUpUser(email, password);
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  console.error('   Please check your Firebase configuration and try again\n');
  process.exit(1);
});
