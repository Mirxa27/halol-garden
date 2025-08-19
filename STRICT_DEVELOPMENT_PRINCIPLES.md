# STRICT DEVELOPMENT PRINCIPLES

## Core Mandates

### 1. NO MOCKS OR ASSUMPTIONS
- **NEVER** create mock data, stub services, or placeholder implementations
- **ALWAYS** integrate with real services, databases, and APIs
- **REQUIRE** actual credentials and configurations for all external services
- **EXCEPTION**: Third-party services that are completely unavailable may use circuit breakers with explicit fallback behavior

### 2. FULL, COMPLETE DEVELOPMENT
- **EVERY** feature must be production-ready before commit
- **NO** partial implementations, TODOs in production code, or "coming soon" features
- **REQUIRE** complete error handling, logging, monitoring, and recovery mechanisms
- **ENFORCE** 100% feature completeness with all edge cases handled

### 3. ZERO BULLSHITTING
- **NO** unnecessary code, comments, or documentation
- **EVERY** line of code must have a clear, verifiable purpose
- **PROHIBIT** copy-paste programming without understanding
- **REQUIRE** accurate, concise, and essential documentation only

### 4. SINGLE-SOURCE FILES
- **NEVER** create duplicate files with suffixes like "_new", "_updated", "_enhanced", "_v2"
- **ALWAYS** modify the original file directly
- **USE** version control (git) for tracking changes, not file naming
- **ENFORCE** single source of truth for every component, service, and configuration

### 5. LATEST STABLE DEPENDENCIES
- **ALWAYS** use the latest stable versions of all dependencies
- **UPDATE** dependencies before starting any new feature
- **PROHIBIT** using deprecated, beta, or alpha versions in production
- **AUTOMATE** dependency updates with security scanning

## Implementation Standards

### Code Quality Requirements

```typescript
// tsconfig.json strict settings (MANDATORY)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Production Readiness Checklist

#### Before ANY Code Commit:
- [ ] All TypeScript strict mode errors resolved
- [ ] Zero ESLint warnings or errors
- [ ] All tests passing (unit, integration, e2e)
- [ ] Performance benchmarks met (< 100ms API response, < 3s page load)
- [ ] Security scan passed (no vulnerabilities)
- [ ] Accessibility audit passed (WCAG 2.1 AA compliant)
- [ ] Error boundaries implemented for all React components
- [ ] Logging implemented for all critical paths
- [ ] Monitoring alerts configured
- [ ] Rate limiting implemented for all API endpoints
- [ ] Input validation on both client and server
- [ ] CORS properly configured
- [ ] Environment variables validated
- [ ] Database migrations tested and reversible
- [ ] Backup and recovery procedures documented and tested

### Database Operations

```typescript
// MANDATORY: All database operations must include:
interface DatabaseOperation {
  transaction: boolean; // Must use transactions for multi-step operations
  retryStrategy: RetryConfig; // Exponential backoff for transient failures
  timeout: number; // Maximum execution time
  logging: boolean; // Audit trail for all operations
  validation: ZodSchema; // Input/output validation
}

// Example implementation
async function createUser(data: UserInput): Promise<User> {
  // REQUIRED: Input validation
  const validated = userSchema.parse(data);
  
  // REQUIRED: Transaction with retry
  return await prisma.$transaction(async (tx) => {
    // REQUIRED: Check for duplicates
    const existing = await tx.user.findUnique({
      where: { email: validated.email }
    });
    
    if (existing) {
      // REQUIRED: Proper error handling
      throw new ConflictError('User already exists');
    }
    
    // REQUIRED: Audit logging
    await tx.auditLog.create({
      data: {
        action: 'USER_CREATE',
        details: { email: validated.email },
        timestamp: new Date()
      }
    });
    
    // Create user with all required fields
    return await tx.user.create({
      data: validated,
      include: { profile: true } // REQUIRED: Return complete data
    });
  }, {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: 'Serializable'
  });
}
```

### API Endpoint Standards

```typescript
// MANDATORY: Every API endpoint must implement:
interface APIEndpointRequirements {
  authentication: boolean; // JWT or session validation
  authorization: RoleCheck; // Role-based access control
  rateLimiting: RateLimitConfig; // Prevent abuse
  validation: {
    params: ZodSchema;
    query: ZodSchema;
    body: ZodSchema;
  };
  monitoring: {
    metrics: boolean; // Response time, error rate
    logging: boolean; // Request/response logging
    tracing: boolean; // Distributed tracing
  };
  errorHandling: {
    standardized: boolean; // Consistent error format
    detailed: boolean; // Stack traces in dev only
    recovery: boolean; // Graceful degradation
  };
  documentation: {
    openapi: boolean; // OpenAPI/Swagger spec
    examples: boolean; // Request/response examples
  };
}
```

### Frontend Component Standards

```tsx
// MANDATORY: Every React component must include:
interface ComponentRequirements {
  errorBoundary: boolean; // Catch and handle errors
  loading: boolean; // Loading states
  empty: boolean; // Empty states
  error: boolean; // Error states
  accessibility: {
    aria: boolean; // ARIA labels and roles
    keyboard: boolean; // Keyboard navigation
    screenReader: boolean; // Screen reader support
  };
  performance: {
    memoization: boolean; // React.memo where appropriate
    lazyLoading: boolean; // Code splitting for routes
    virtualization: boolean; // For large lists
  };
  testing: {
    unit: boolean; // Component logic tests
    integration: boolean; // User interaction tests
    snapshot: boolean; // Visual regression tests
  };
}

// Example implementation
const UserList: React.FC<UserListProps> = React.memo(({ 
  users, 
  onUserSelect 
}) => {
  // REQUIRED: Error boundary wrapper
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <div role="list" aria-label="User list">
        {/* REQUIRED: Loading state */}
        {isLoading && <LoadingSpinner aria-label="Loading users" />}
        
        {/* REQUIRED: Empty state */}
        {!isLoading && users.length === 0 && (
          <EmptyState message="No users found" />
        )}
        
        {/* REQUIRED: Error state */}
        {error && <ErrorMessage error={error} retry={refetch} />}
        
        {/* REQUIRED: Virtualization for performance */}
        {users.length > 0 && (
          <VirtualList
            items={users}
            renderItem={(user) => (
              <UserCard
                key={user.id}
                user={user}
                onClick={() => onUserSelect(user)}
                role="listitem"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onUserSelect(user);
                  }
                }}
              />
            )}
          />
        )}
      </div>
    </ErrorBoundary>
  );
});

UserList.displayName = 'UserList';
```

## Enforcement Mechanisms

### Pre-Commit Hooks

```bash
#!/bin/bash
# .husky/pre-commit

# 1. Check for duplicate files
if find . -name "*_new.*" -o -name "*_updated.*" -o -name "*_v2.*" | grep -q .; then
  echo "ERROR: Duplicate files detected. Modify original files only."
  exit 1
fi

# 2. Run strict TypeScript check
npm run type-check:strict || exit 1

# 3. Run ESLint with no warnings allowed
npm run lint:strict || exit 1

# 4. Check for TODOs in code
if grep -r "TODO\|FIXME\|HACK" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .; then
  echo "ERROR: TODOs found in code. Complete all implementations."
  exit 1
fi

# 5. Check for console.log statements
if grep -r "console\.log" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .; then
  echo "ERROR: console.log found. Use proper logging service."
  exit 1
fi

# 6. Run security audit
npm audit --audit-level=moderate || exit 1

# 7. Check test coverage
npm run test:coverage -- --coverage.threshold=80 || exit 1

# 8. Validate environment variables
npm run validate:env || exit 1
```

### Continuous Integration Checks

```yaml
# .github/workflows/production-standards.yml
name: Production Standards Enforcement

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Check for mocks
        run: |
          if grep -r "mock\|stub\|fake" --include="*.ts" --include="*.tsx" --exclude-dir=__tests__; then
            echo "::error::Mock implementations found in production code"
            exit 1
          fi
      
      - name: Validate dependencies are latest
        run: |
          npm outdated --json | jq -e 'length == 0'
      
      - name: Security scan
        run: |
          npm audit --audit-level=critical
          npx snyk test
      
      - name: Performance benchmark
        run: npm run benchmark:ci
      
      - name: Accessibility audit
        run: npm run audit:accessibility
      
      - name: Database migration test
        run: |
          npm run migrate:test
          npm run migrate:rollback:test
```

## Dependency Management

### Update Strategy

```json
// package.json scripts
{
  "scripts": {
    "deps:check": "npm-check-updates",
    "deps:update": "npm-check-updates -u && npm install && npm test",
    "deps:audit": "npm audit fix && snyk test",
    "deps:validate": "node scripts/validate-dependencies.js"
  }
}
```

### Validation Script

```javascript
// scripts/validate-dependencies.js
const package = require('../package.json');
const https = require('https');

async function validateDependencies() {
  const errors = [];
  
  for (const [name, version] of Object.entries(package.dependencies)) {
    // Check if using exact version (no ^ or ~)
    if (version.includes('^') || version.includes('~')) {
      errors.push(`${name}: Use exact versions only`);
    }
    
    // Check if package is deprecated
    const isDeprecated = await checkDeprecation(name);
    if (isDeprecated) {
      errors.push(`${name}: Package is deprecated`);
    }
    
    // Check for known vulnerabilities
    const hasVulnerabilities = await checkVulnerabilities(name, version);
    if (hasVulnerabilities) {
      errors.push(`${name}@${version}: Has known vulnerabilities`);
    }
  }
  
  if (errors.length > 0) {
    console.error('Dependency validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
  
  console.log('✅ All dependencies validated successfully');
}
```

## Monitoring and Observability

### Required Metrics

```typescript
// Every production deployment must track:
interface ProductionMetrics {
  performance: {
    responseTime: Histogram; // p50, p95, p99
    throughput: Counter; // requests per second
    errorRate: Gauge; // percentage of failed requests
  };
  business: {
    userActivity: Counter; // active users
    transactions: Counter; // successful transactions
    revenue: Gauge; // monetary metrics
  };
  infrastructure: {
    cpu: Gauge; // CPU usage percentage
    memory: Gauge; // Memory usage
    diskIO: Counter; // Disk operations
    networkIO: Counter; // Network traffic
  };
  custom: {
    [key: string]: Metric; // Application-specific metrics
  };
}
```

### Alert Configuration

```yaml
# alerts.yml - MANDATORY for production
alerts:
  - name: HighErrorRate
    condition: error_rate > 1%
    duration: 5m
    severity: critical
    
  - name: SlowResponse
    condition: p95_response_time > 1000ms
    duration: 10m
    severity: warning
    
  - name: LowAvailability
    condition: uptime < 99.9%
    duration: 1h
    severity: critical
    
  - name: DatabaseConnectionPool
    condition: connection_pool_usage > 80%
    duration: 5m
    severity: warning
```

## Documentation Requirements

### API Documentation

Every endpoint MUST have:
- OpenAPI/Swagger specification
- Request/response examples
- Error scenarios and codes
- Rate limits and quotas
- Authentication requirements
- Performance benchmarks

### Code Documentation

```typescript
/**
 * REQUIRED: JSDoc for all public functions
 * @description Clear, concise description of what the function does
 * @param {Type} param - What the parameter represents
 * @returns {Type} What the function returns
 * @throws {ErrorType} When the function throws
 * @example
 * // How to use the function
 * const result = await functionName(param);
 */
```

## Security Standards

### OWASP Top 10 Compliance

All code must address:
1. Injection prevention (parameterized queries)
2. Authentication (secure session management)
3. Sensitive data exposure (encryption at rest and in transit)
4. XML external entities (XXE) prevention
5. Broken access control (proper authorization)
6. Security misconfiguration (secure defaults)
7. Cross-site scripting (XSS) prevention
8. Insecure deserialization (input validation)
9. Components with known vulnerabilities (dependency scanning)
10. Insufficient logging and monitoring

### Security Headers

```typescript
// MANDATORY: All responses must include
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
```

## Compliance and Audit

### Automated Compliance Checks

```bash
# Run before every deployment
npm run compliance:check

# Includes:
# - License compatibility check
# - GDPR compliance scan
# - Accessibility audit (WCAG 2.1 AA)
# - Security vulnerability scan
# - Performance budget validation
# - Code quality metrics
# - Test coverage requirements
# - Documentation completeness
```

### Manual Review Checklist

Before marking any feature as complete:
- [ ] Code reviewed by at least 2 senior developers
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Rollback plan documented
- [ ] Change log updated

## Enforcement

**VIOLATIONS OF THESE PRINCIPLES WILL RESULT IN:**
1. Automatic build failure
2. Pull request rejection
3. Deployment prevention
4. Performance review impact

**NO EXCEPTIONS WITHOUT:**
- Written justification
- Architecture team approval
- Documented mitigation plan
- Timeline for compliance

---

**Remember: We build production systems, not prototypes. Every line of code is a commitment to excellence.**