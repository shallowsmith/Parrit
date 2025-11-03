# Parrit Client Setup Guide

## Implementation Complete! ✅

I've successfully implemented the authentication flow for the Parrit React Native app. Here's what was built:

## What's Been Implemented

### 1. **Dependencies Installed**
- `firebase` - Firebase Authentication SDK
- `axios` - HTTP client for backend API calls
- `react-hook-form` - Form validation and management
- `@react-native-async-storage/async-storage` - Persistent storage

### 2. **Project Structure Created**

```
client/
├── .env                                # Environment configuration (NEEDS YOUR FIREBASE KEYS!)
├── config/
│   ├── constants.ts                    # API URL and Firebase config
│   └── firebase.ts                     # Firebase client initialization
├── types/
│   └── auth.types.ts                   # TypeScript interfaces
├── services/
│   ├── firebase.service.ts             # Firebase auth methods
│   ├── api.ts                          # Axios instance with interceptors
│   └── auth.service.ts                 # Backend API calls
├── contexts/
│   └── AuthContext.tsx                 # Global auth state management
├── components/
│   └── ui/
│       ├── Button.tsx                  # Green button component
│       ├── Input.tsx                   # Dark green input with label
│       ├── Checkbox.tsx                # Terms checkbox
│       └── LoadingSpinner.tsx          # Loading screen
└── app/
    ├── _layout.tsx                     # ✅ UPDATED: AuthProvider + navigation guards
    ├── (auth)/
    │   ├── _layout.tsx                 # Auth stack navigator
    │   ├── login.tsx                   # Login screen
    │   └── register.tsx                # Register screen (Firebase + Profile)
    └── (tabs)/
        └── _layout.tsx                 # ✅ UPDATED: Auth guard
```

### 3. **Key Features**

#### Authentication Flow
- **Login**: Email/password authentication with Firebase
- **Register**: One-screen registration with ALL fields:
  - Full Name (split into firstName/lastName)
  - Email
  - Password & Confirm Password
  - Birthday (MM/DD format)
  - Phone Number
  - Terms of Service checkbox
- **Auto Profile Creation**: When user registers, Firebase user AND backend profile are created automatically
- **Token Management**: Automatic JWT refresh to get `userId` custom claim
- **Navigation Guards**: Automatic routing based on auth state

#### UI Components
- Themed dark UI matching your PDF designs
- Form validation with helpful error messages
- Loading states and disabled states
- Password visibility toggle

## NEXT STEPS - IMPORTANT! ⚠️

### 1. Configure Environment Variables

Edit `client/.env` and add your Firebase configuration:

```env
# Update this with your machine's IP address (not localhost!)
# Find your IP: Mac: System Settings > Network, Windows: ipconfig
EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3000/api/v1

# Get these from Firebase Console > Project Settings > General
EXPO_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=parrit-fc705.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=parrit-fc705
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=parrit-fc705.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-actual-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-actual-app-id
```

**Where to find Firebase keys:**
1. Go to https://console.firebase.google.com/
2. Select "parrit-fc705" project
3. Click ⚙️ Settings icon → Project Settings
4. Scroll to "Your apps" section
5. If no app exists, click "Add app" → Web
6. Copy the `firebaseConfig` values

### 2. Start the Backend Server

```bash
cd server
npm run dev
```

Server should be running on `http://localhost:3000`

### 3. Start the Expo App

```bash
cd client
npm start
```

Then press:
- `i` for iOS Simulator
- `a` for Android Emulator
- Or scan QR code with Expo Go app on your phone

## Testing the Authentication Flow

### Test Register Flow:

1. App opens → Should show **Login screen**
2. Click "Sign Up" → Goes to **Register screen**
3. Fill out the form:
   - Full Name: `John Doe`
   - Email: `john@test.com`
   - Password: `password123`
   - Confirm Password: `password123`
   - Birthday: `01/15`
   - Phone Number: `+1234567890`
4. Check "I agree to Terms of Service"
5. Click "Create Account"
6. Behind the scenes:
   - ✅ Firebase creates user
   - ✅ Backend creates profile at `POST /api/v1/profiles`
   - ✅ JWT refreshed with `userId` custom claim
   - ✅ Navigate to main app (tabs)

### Test Login Flow:

1. From Register screen, go back to Login
2. Enter:
   - Email: `john@test.com`
   - Password: `password123`
3. Click "Log In"
4. Should navigate to main app (tabs)

## Troubleshooting

### "Network request failed"
- Make sure backend server is running on `http://localhost:3000`
- Update `.env` with your machine's IP address (not `localhost`)
- For mobile: `EXPO_PUBLIC_API_URL=http://192.168.1.x:3000/api/v1`

### "Firebase: Error (auth/invalid-api-key)"
- Check that Firebase keys in `.env` are correct
- Make sure you copied the ENTIRE key (they're long!)
- Restart Expo dev server after changing `.env`

### "Email already in use"
- This email is already registered in Firebase
- Try a different email or delete the user from Firebase Console

### App shows blank screen
- Check terminal for errors
- Make sure you ran `npm install` in `/client`
- Try clearing cache: `npm start -- --clear`

### Can't see auth screens
- Auth screens are at `/(auth)/login` and `/(auth)/register`
- Check `app/_layout.tsx` - should have AuthProvider wrapper
- Check browser console / Metro logs for navigation errors

## Code Architecture Highlights

### AuthContext (`contexts/AuthContext.tsx`)
- Manages auth state globally
- Listens to Firebase auth state changes
- Syncs with backend profile status
- Provides `login`, `register`, `logout` functions

### Register Screen (`app/(auth)/register.tsx`)
- Combines Firebase signup + Backend profile creation
- Validates all fields with `react-hook-form`
- Splits full name into firstName/lastName
- Validates birthday format (MM/DD)
- Checks Terms of Service agreement
- If profile creation fails, deletes Firebase user (consistency)

### Login Screen (`app/(auth)/login.tsx`)
- Firebase email/password authentication
- Checks backend login status
- Redirects to main app on success
- Shows helpful error messages

### API Service (`services/api.ts`)
- Axios instance with JWT auto-injection
- Automatic token refresh on 401 errors
- Retry failed requests after refresh

### Root Layout (`app/_layout.tsx`)
- Wraps app with `AuthProvider`
- Conditional routing based on auth state:
  - Not authenticated → Login screen
  - Authenticated → Main app (tabs)
- Shows loading spinner while checking auth

## What's NOT Implemented (For Future)

- ❌ Forgot Password functionality (UI only, disabled)
- ❌ Social Login (Google/Apple) - Buttons disabled
- ❌ Voice recording feature
- ❌ Receipt scanning
- ❌ Main app screens (using Expo template screens for now)

## Design Colors Used

Based on your PDF mockups:

```typescript
{
  primary: '#6FA85F',           // Green buttons
  background: '#000000',         // Black background
  inputBg: '#3A4A3A',           // Dark green inputs
  text: '#FFFFFF',              // White text
  textSecondary: '#B0B0B0',     // Gray text
  error: '#FF4444',             // Error red
}
```

## Files Modified

- ✅ `app/_layout.tsx` - Added AuthProvider and navigation logic
- ✅ `app/(tabs)/_layout.tsx` - Added auth guard
- ✅ `constants/theme.ts` - Added AppColors export

## Backend Integration

The app is configured to work with your existing backend:

- `POST /api/v1/login` - Check if user has profile (200 or 404)
- `POST /api/v1/profiles` - Create user profile with JWT
- JWT tokens automatically included in all API requests
- Token refresh happens automatically on expiration

## Ready to Test! 🚀

1. ✅ Add Firebase keys to `.env`
2. ✅ Start backend server
3. ✅ Start Expo app: `npm start`
4. ✅ Test register flow
5. ✅ Test login flow
6. ✅ Celebrate! 🎉

Need help? Check the terminal logs - they're very detailed and will show you exactly what's happening.
