# AI2 Platform Test Suite

Comprehensive test suite for the AI2 platform authentication and core functionality.

## Overview

This test suite provides automated testing for:
- Authentication flows (Bearer tokens, Cookie-based BFF)
- JWT token verification and debugging
- CORS configuration
- API endpoint security
- Page refresh scenarios

## Structure

```
tests/
├── auth/
│   ├── comprehensive-auth-test.js    # Main authentication test suite
│   └── jwt-debug-test.js            # JWT token debugging utilities
├── scripts/
│   └── generate-test-report.js      # Test report generation
├── package.json                     # Test dependencies and scripts
└── README.md                        # This file
```

## Environment Variables

Set these environment variables for testing:

```bash
# Required
JWT_SECRET="your-jwt-secret"

# Optional (defaults provided)
TEST_BASE_URL="http://localhost:3001"
TEST_USER_EMAIL="test@embracingearth.space"
TEST_USER_PASSWORD="TestPass123!"
```

## Running Tests

### Install Dependencies
```bash
cd tests
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Tests
```bash
# Authentication tests only
npm run test:auth

# JWT debugging only
npm run test:jwt

# All tests with report generation
npm run test:ci
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: AI2 Platform Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd tests
        npm install
    
    - name: Run tests
      env:
        JWT_SECRET: ${{ secrets.JWT_SECRET }}
        TEST_BASE_URL: ${{ secrets.TEST_BASE_URL }}
        TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
        TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      run: |
        cd tests
        npm run test:ci
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: tests/test-report.*
```

### Docker Integration

```dockerfile
# Add to your Dockerfile for testing
FROM node:18-alpine AS test

WORKDIR /app
COPY tests/ ./tests/
RUN cd tests && npm install

# Run tests
ENV NODE_ENV=test
RUN cd tests && npm run test:ci
```

## Test Results

Tests generate the following output files:

- `auth-test-results.json` - Detailed authentication test results
- `jwt-debug-results.json` - JWT token debugging information
- `test-report.json` - Comprehensive test report (JSON)
- `test-report.md` - Human-readable test report (Markdown)

## Test Categories

### Authentication Tests (`comprehensive-auth-test.js`)

1. **Health & Basics**
   - Backend health check
   - Unauthenticated endpoint access
   - Protected endpoint security

2. **Bearer Token Authentication**
   - OIDC login and token generation
   - Bearer token validation
   - Protected endpoint access with tokens
   - Data endpoint testing

3. **Cookie Authentication (BFF)**
   - Session cookie generation
   - CSRF token handling
   - Cookie-based authentication
   - Protected endpoint access with cookies

4. **Page Refresh Scenarios**
   - Token persistence testing
   - User data retrieval after refresh

5. **CORS Configuration**
   - Cross-origin request handling
   - Credentials support verification

### JWT Debugging (`jwt-debug-test.js`)

- JWT token structure analysis
- Token verification testing
- Secret validation
- Payload inspection
- Error diagnosis

## Troubleshooting

### Common Issues

1. **JWT_SECRET not found**
   - Ensure JWT_SECRET environment variable is set
   - Check .env file configuration

2. **Connection refused**
   - Verify the backend server is running
   - Check TEST_BASE_URL configuration

3. **Authentication failures**
   - Verify test user credentials
   - Check OIDC configuration
   - Ensure database is properly migrated

### Debug Mode

Run tests with debug output:

```bash
DEBUG=1 npm run test:auth
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Add appropriate error handling
3. Update this README
4. Ensure CI/CD compatibility
5. Add environment variable documentation

## License

MIT License - embracingearth.space
