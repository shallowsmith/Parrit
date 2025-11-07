/**
 * Firebase Login Script
 *
 * Authenticates with Firebase using email and password, then returns the JWT ID token.
 * Useful for testing protected API endpoints during development.
 *
 * Usage:
 *   node scripts/firebase-login.js <email> <password>
 *   npm run firebase-login <email> <password>
 *
 * Example:
 *   node scripts/firebase-login.js user@example.com mypassword123
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase client configuration (loaded from environment variables)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('\n❌ Error: Firebase configuration not found in environment variables\n');
  console.error('Please check that your .env file has:');
  console.error('  - FIREBASE_API_KEY');
  console.error('  - FIREBASE_AUTH_DOMAIN');
  console.error('  - FIREBASE_PROJECT_ID');
  console.error('  - FIREBASE_STORAGE_BUCKET');
  console.error('  - FIREBASE_MESSAGING_SENDER_ID');
  console.error('  - FIREBASE_APP_ID\n');
  process.exit(1);
}

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
 * Decodes JWT token to extract custom claims (without verification)
 * This is safe for development/testing purposes only
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('Failed to decode JWT:', error.message);
    return null;
  }
}

/**
 * Main authentication function
 */
async function loginToFirebase(email, password) {
  try {
    console.log('\n🔐 Firebase Authentication');
    console.log('========================\n');

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    console.log('🔄 Signing in...');

    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get the ID token (JWT)
    const idToken = await user.getIdToken();

    // Get ID token result with custom claims
    const idTokenResult = await user.getIdTokenResult();

    console.log('\n✅ Successfully authenticated!\n');

    // Display user information
    console.log('📋 User Information:');
    console.log(`   User ID (UID): ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Verified: ${user.emailVerified}`);

    // Display JWT token
    console.log('\n🎫 JWT ID Token:');
    console.log(`   ${idToken}`);

    // Display token expiration
    const expirationTime = new Date(idTokenResult.expirationTime).getTime();
    console.log('\n⏰ Token Expiration:');
    console.log(`   Expires at: ${formatDate(expirationTime)}`);
    console.log(`   Expires in: ${getTimeRemaining(expirationTime)}`);

    // Display custom claims
    if (idTokenResult.claims && Object.keys(idTokenResult.claims).length > 0) {
      console.log('\n🔑 Custom Claims:');

      // Filter out standard Firebase claims to show only custom ones
      const standardClaims = ['iss', 'aud', 'auth_time', 'user_id', 'sub', 'iat', 'exp', 'email', 'email_verified', 'firebase'];
      const customClaims = Object.entries(idTokenResult.claims)
        .filter(([key]) => !standardClaims.includes(key));

      if (customClaims.length > 0) {
        customClaims.forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });

        // Highlight if userId is present (important for our API authorization)
        if (idTokenResult.claims.userId) {
          console.log('\n   ✨ userId claim is set! You can now access protected resources.');
        }
      } else {
        console.log('   No custom claims set yet.');
        console.log('   Note: Create a profile first to get the userId custom claim.');
      }
    }

    // Display decoded token payload for debugging
    const decodedToken = decodeJWT(idToken);
    if (decodedToken) {
      console.log('\n📦 Decoded Token Payload:');
      console.log(JSON.stringify(decodedToken, null, 2));
    }

    // Usage instructions
    console.log('\n📝 Usage:');
    console.log('   Copy the JWT token above and use it in your API requests:');
    console.log('   Authorization: Bearer <token>\n');
    console.log('   Example with curl:');
    console.log(`   curl -H "Authorization: Bearer ${idToken.substring(0, 50)}..." \\`);
    console.log('        http://localhost:3000/api/v1/profiles/YOUR_USER_ID\n');

  } catch (error) {
    console.error('\n❌ Authentication failed!\n');

    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      console.error('   Error: Invalid email or password');
    } else if (error.code === 'auth/user-not-found') {
      console.error('   Error: No user found with this email');
    } else if (error.code === 'auth/too-many-requests') {
      console.error('   Error: Too many failed login attempts. Please try again later.');
    } else if (error.code === 'auth/network-request-failed') {
      console.error('   Error: Network error. Please check your internet connection.');
    } else {
      console.error(`   Error: ${error.message}`);
    }

    console.error('\n');
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
    console.error('  node scripts/firebase-login.js <email> <password>');
    console.error('  npm run firebase-login <email> <password>\n');
    console.error('Example:');
    console.error('  node scripts/firebase-login.js user@example.com mypassword123\n');
    process.exit(1);
  }

  const [email, password] = args;

  // Validate email format (basic check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('\n❌ Error: Invalid email format\n');
    process.exit(1);
  }

  // Validate password length
  if (password.length < 6) {
    console.error('\n❌ Error: Password must be at least 6 characters\n');
    process.exit(1);
  }

  // Perform login
  await loginToFirebase(email, password);
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
