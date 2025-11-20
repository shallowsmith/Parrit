/**
 * Jest Setup File
 *
 * Configures mocks and test environment for Jest tests
 */


// Jest should be available globally in setup files
// If not available, we'll define a minimal jest object for setup
const jestInstance = global.jest || {
  fn: () => () => {},
  mock: () => {},
};

// jest-expo handles Platform setup - no need to override

// Mock AsyncStorage using React Native Testing Library approach
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Create a single mock axios instance that will be reused
const mockAxiosInstance = {
  interceptors: {
    request: {
      use: jest.fn(),
      handlers: [],
    },
    response: {
      use: jest.fn(),
      handlers: [],
    },
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  request: jest.fn(),
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
  default: {
    create: jest.fn(() => mockAxiosInstance),
  },
}));

// Mock Firebase comprehensively to avoid ES module issues
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

// Create mock auth object with proper callback handling
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn((callback) => {
    // Store the callback for testing
    mockAuth._authCallback = callback;
    // Return unsubscribe function
    return jest.fn();
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
};

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Store the callback for testing
    mockAuth._authCallback = callback;
    // Return unsubscribe function
    return jest.fn();
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Firebase config
jest.mock('./config/firebase', () => ({
  auth: mockAuth,
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => '/',
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
  Link: 'Link',
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      version: '1.0.0',
    },
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Mock react-native-reanimated with a safer approach
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn((value) => value),
  withSpring: jest.fn((value) => value),
  runOnJS: jest.fn((fn) => fn),
  interpolate: jest.fn((value, inputRange, outputRange) => value),
  Extrapolate: {
    CLAMP: 'clamp',
  },
}));

// Set up React Native environment for iOS testing
global.__DEV__ = true;

// Silence console warnings and logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

