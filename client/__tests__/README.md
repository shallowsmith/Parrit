# Parrit Client - White Box Testing Suite

This directory contains all tests for the Parrit client application. We have **218 test cases** across 17 test files, providing comprehensive white box testing coverage with **41.21% overall statement coverage**.

## 📂 Directory Structure

```
__tests__/
├── app/(auth)/          ← Authentication screen tests
│   ├── login.test.tsx
│   └── register.test.tsx
├── components/          ← Component tests
│   ├── profile/         ← Profile component tests
│   │   ├── EditProfileForm.test.tsx
│   │   ├── EditProfileModal.test.tsx
│   │   ├── ProfileInfoCard.test.tsx
│   │   └── SettingsSection.test.tsx
│   └── ui/              ← UI component tests
│       ├── Button.test.tsx
│       ├── Input.test.tsx
│       └── LoadingSpinner.test.tsx
├── screens/             ← Screen/page tests
│   ├── help.test.tsx
│   └── profile.test.tsx
├── services/            ← API service tests
│   ├── api.test.ts
│   ├── auth.service.test.ts
│   ├── firebase.service.test.ts
│   └── profile.service.test.ts
├── contexts/            ← Context provider tests
│   └── AuthContext.test.tsx
└── utils/               ← Utility function tests
    └── phoneFormatter.test.ts
```

## 🎯 Test Organization Philosophy

### Centralized Test Directory
All tests are located in the `__tests__` directory at the root of the client folder, separate from source code. This provides:

✅ **Clear separation** - Tests are isolated from production code  
✅ **Easy navigation** - All tests in one place  
✅ **Better IDE support** - Test files don't clutter source directories  
✅ **Cleaner imports** - Source files don't have test dependencies  

### Mirrored Structure
The test directory structure mirrors the source code:

```
Source:                    Tests:
client/                    client/__tests__/
├── app/(auth)/       →    ├── app/(auth)/
├── components/ui/    →    ├── components/ui/
├── components/profile/→   ├── components/profile/
├── app/(tabs)/       →    ├── screens/
├── services/         →    ├── services/
├── contexts/         →    ├── contexts/
└── utils/            →    └── utils/
```

## 🧪 Test Types

### Auth Screen Tests (`app/(auth)/`)
White box tests for authentication screens:
- Screen rendering and structure
- AuthContext integration
- Navigation setup
- Basic form functionality

### Component Tests (`components/`)
White box tests for UI components:
- Props validation and rendering
- User interactions and callbacks
- State management
- Conditional rendering logic

### Screen Tests (`screens/`)
White box tests for full screens:
- Layout structure and navigation
- Context usage and integration
- User workflow validation
- Component composition

### Service Tests (`services/`)
White box tests for API services:
- HTTP requests and responses
- Error handling scenarios
- Authentication and token management
- Data transformation

### Context Tests (`contexts/`)
White box tests for React contexts:
- Provider initialization and setup
- State updates and persistence
- Hook behavior and side effects
- Error handling

### Utility Tests (`utils/`)
White box tests for utility functions:
- Data transformation and validation
- Input sanitization
- Edge cases and error handling
- Performance optimization

## 🚀 Running Tests

### All tests
```bash
npm test
```

### Specific category
```bash
npm test components    # All component tests
npm test services      # All service tests
npm test screens       # All screen tests
```

### Specific file
```bash
npm test Button        # Button component tests
npm test auth.service  # Auth service tests
```

### Watch mode
```bash
npm run test:watch
```

### Coverage
```bash
npm run test:coverage
```

## 📝 Naming Conventions

- Test files: `*.test.{ts,tsx}`
- Component tests: `ComponentName.test.tsx`
- Service tests: `serviceName.test.ts`
- Utility tests: `utilityName.test.ts`

## 🎨 Test Structure

Each test file follows this structure:

```typescript
/**
 * Component/Service Name Tests (White Box)
 * 
 * Brief description of what's being tested
 */

import { render, fireEvent } from '@testing-library/react-native';
import { ComponentName } from '@/path/to/component';

describe('ComponentName', () => {
  describe('Feature/Behavior Group', () => {
    it('does something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## 📊 Test Coverage

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Auth Screens | 2 | 6 | 29.26% |
| UI Components | 3 | 41 | 39.13% |
| Profile Components | 4 | 50 | 52.08% |
| App Screens | 2 | 25 | 34.78% |
| Services | 4 | 76 | 63.63% |
| Contexts | 1 | 14 | 44.89% |
| Utils | 1 | 30 | 100% |
| **Total** | **17** | **218** | **41.21%** |

### Coverage Breakdown by Area
- **Services**: 63.63% (Firebase, Auth, Profile services: 100%)
- **Profile Components**: 52.08% (4/5 components: 100%)
- **UI Components**: 39.13% (Button, Input, LoadingSpinner: 100%)
- **Auth Screens**: 29.26% (Basic rendering coverage)
- **Contexts**: 44.89% (AuthContext with error scenarios)
- **App Screens**: 34.78% (Help and Profile screens)

## 🔧 Configuration

Tests are configured in:
- `package.json` - Jest configuration with testMatch pattern
- `jest.setup.js` - Global mocks and setup
- `tsconfig.json` - TypeScript path aliases

## 🔍 White Box vs Black Box Testing

### White Box Testing (What We Built) ✅
**Tests the internal structure and implementation**

- Tests know about props, state, and functions
- Uses mocks for dependencies (Firebase, API, AsyncStorage)
- Verifies specific function calls and logic flow
- Fast execution, isolated tests
- Great for unit and integration testing

**Example:**
```typescript
it('calls onPress when pressed', () => {
  const mockOnPress = jest.fn();
  const { getByText } = render(<Button title="Click" onPress={mockOnPress} />);

  fireEvent.press(getByText('Click'));
  expect(mockOnPress).toHaveBeenCalledTimes(1); // ← Checks internal behavior
});

it('shows loading spinner when loading', () => {
  const { UNSAFE_getByType, queryByText } = render(
    <Button title="Submit" onPress={() => {}} loading={true} />
  );

  const spinner = UNSAFE_getByType(ActivityIndicator);
  expect(spinner).toBeTruthy(); // ← Checks internal rendering
  expect(queryByText('Submit')).toBeNull(); // ← Checks conditional logic
});
```

### Black Box Testing (Future: E2E with Detox)
**Tests from the user's perspective**

- No knowledge of internal code
- Tests complete user workflows
- Uses real devices/simulators
- Slower execution
- Great for end-to-end testing

**Example:**
```typescript
it('user can register and login', async () => {
  await element(by.id('email-input')).typeText('test@example.com');
  await element(by.id('register-button')).tap();
  await expect(element(by.id('home-screen'))).toBeVisible(); // ← Only cares about result
});
```

## 🎓 Test Examples

### Component Test
```typescript
describe('Button Component', () => {
  it('renders with correct title', () => {
    const { getByText } = render(<Button title="Press Me" onPress={() => {}} />);
    expect(getByText('Press Me')).toBeTruthy();
  });

  it('shows loading state', () => {
    const { getByTestId, queryByText } = render(
      <Button title="Submit" onPress={() => {}} loading={true} />
    );
    
    expect(getByTestId('activity-indicator')).toBeTruthy();
    expect(queryByText('Submit')).toBeNull();
  });
});
```

### Service Test
```typescript
describe('Auth Service', () => {
  it('calls POST /profiles/login endpoint', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { message: 'Login success', profile: mockProfile },
      status: 200,
    });

    const result = await authService.checkLoginStatus();

    expect(api.post).toHaveBeenCalledWith('/profiles/login');
    expect(result.data.message).toBe('Login success');
  });
});
```

## 🐛 Debugging Tests

### View console logs
```typescript
console.log('Debug:', someValue);
```

### Use screen.debug()
```typescript
const { debug } = render(<MyComponent />);
debug(); // Prints component tree
```

### Run single test
```typescript
it.only('this test runs alone', () => {
  // Only this test will run
});
```

### Skip test
```typescript
it.skip('this test is skipped', () => {
  // This test won't run
});
```

## 📈 Next Steps

### ✅ **Completed**
1. **Core Services**: 100% coverage for Firebase, Auth, Profile services
2. **Profile Components**: 100% coverage for 4/5 profile components
3. **UI Components**: 100% coverage for Button, Input, LoadingSpinner
4. **AuthContext**: Comprehensive testing with error scenarios
5. **Auth Screens**: Basic rendering and integration tests

### 🚧 **In Progress**
1. **Increase Coverage**: Currently 41.21%, target 70-80%
2. **Complex Components**: SpendingHistoryChart (SVG/D3 integration)
3. **Remaining Screens**: scan, voice, index screens (0% coverage)

### 🔮 **Future Enhancements**
1. **E2E Tests**: Use Detox for black box testing
2. **Advanced Auth Testing**: Form validation and error flows
3. **Performance Testing**: Component rendering performance
4. **CI/CD Integration**: Automated testing on push/PR
5. **Mutation Testing**: Validate test quality with Stryker

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [jest-expo](https://docs.expo.dev/develop/unit-testing/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Ready to test?** Run `npm test` to execute all 218 tests or `npm run test:coverage` for coverage reports! 🚀

**Current Status**: 17 test files, 218 passing tests, 41.21% overall coverage with excellent coverage of core business logic.
