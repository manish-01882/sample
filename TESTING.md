# Testing Documentation

This project uses Jest for unit testing. The tests are located in files with `.test.ts` or `.test.js` extensions next to the source files they are testing.

## Running Tests

To run the tests, use the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

The tests are organized following these principles:

1. **Unit Tests**: Tests for individual functions and components
2. **Mock Dependencies**: External dependencies are mocked to isolate the code being tested
3. **Test Coverage**: Aim for high test coverage, especially for critical business logic

## Test Files

- `src/lib/supabase.test.ts`: Tests for Supabase client setup and basic operations
- `src/lib/supabaseData.test.ts`: Tests for Supabase data operations (CRUD functions)
- `src/lib/gemini.test.ts`: Tests for Google Gemini AI integration

## Adding New Tests

When adding new functionality, follow these steps to add tests:

1. Create a new test file with the same name as the file you're testing, but with `.test.ts` extension
2. Import the functions/components you want to test
3. Mock any external dependencies
4. Write test cases covering:
   - Happy path (expected behavior with valid inputs)
   - Edge cases (boundary conditions)
   - Error handling (how the code handles failures)

## Example Test Structure

```typescript
import { functionToTest } from './file-to-test';

// Mock dependencies
jest.mock('./dependency', () => ({
  dependencyFunction: jest.fn(),
}));

describe('Function or Component Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something specific', () => {
    // Arrange - set up test data
    const testInput = 'test';
    
    // Act - call the function being tested
    const result = functionToTest(testInput);
    
    // Assert - verify the results
    expect(result).toBe(expectedOutput);
  });
  
  // More test cases...
});
```

## Best Practices

1. Keep tests simple and focused on a single behavior
2. Use descriptive test names that explain what is being tested
3. Follow the AAA pattern: Arrange, Act, Assert
4. Mock external dependencies to isolate the code being tested
5. Test both success and failure scenarios
6. Aim for high test coverage, especially for critical business logic