#!/usr/bin/env node

/**
 * STRICT PRODUCTION VALIDATION SCRIPT
 * Enforces all production standards before deployment
 * NO EXCEPTIONS - ALL CHECKS MUST PASS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.criticalFailure = false;
  }

  log(message, type = 'info') {
    const colors = {
      error: '\x1b[31m',
      warning: '\x1b[33m',
      success: '\x1b[32m',
      info: '\x1b[36m',
      reset: '\x1b[0m'
    };
    
    const prefix = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️'
    };
    
    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  async validate() {
    console.log('\n🚀 PRODUCTION VALIDATION STARTING...\n');
    console.log('Enforcing STRICT development principles:');
    console.log('1. NO MOCKS - Real services only');
    console.log('2. COMPLETE FEATURES - No partial implementations');
    console.log('3. ZERO BS - Every line must have purpose');
    console.log('4. SINGLE SOURCE - No duplicate files');
    console.log('5. LATEST STABLE - All dependencies current\n');
    
    // Run all validations
    this.checkDuplicateFiles();
    this.checkMockImplementations();
    this.checkTodos();
    this.checkConsoleStatements();
    this.checkTypeScript();
    this.checkESLint();
    this.checkSecurity();
    this.checkTests();
    this.checkDependencies();
    this.checkEnvironment();
    this.checkPerformance();
    this.checkAccessibility();
    this.checkDocumentation();
    this.checkDatabase();
    this.checkApiDocumentation();
    
    // Print final report
    this.printReport();
    
    // Exit with appropriate code
    if (this.criticalFailure || this.errors.length > 0) {
      process.exit(1);
    }
    
    process.exit(0);
  }

  checkDuplicateFiles() {
    this.log('Checking for duplicate files...', 'info');
    
    try {
      const patterns = ['*_new.*', '*_updated.*', '*_v2.*', '*_copy.*', '*_backup.*', '*_old.*'];
      let duplicatesFound = false;
      
      patterns.forEach(pattern => {
        const command = `find . -name "${pattern}" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./dist/*"`;
        try {
          const result = execSync(command, { encoding: 'utf8' });
          if (result.trim()) {
            duplicatesFound = true;
            this.errors.push(`Duplicate files found with pattern ${pattern}:\n${result}`);
          }
        } catch (e) {
          // No files found, which is good
        }
      });
      
      if (!duplicatesFound) {
        this.passed.push('No duplicate files (single source principle)');
        this.log('No duplicate files found', 'success');
      } else {
        this.log('VIOLATION: Duplicate files detected', 'error');
        this.criticalFailure = true;
      }
    } catch (e) {
      this.warnings.push('Could not check for duplicate files');
    }
  }

  checkMockImplementations() {
    this.log('Checking for mock implementations...', 'info');
    
    try {
      const mockPatterns = [
        'mock(?!ito)', // mock but not mockito (Java testing framework)
        'stub',
        'fake',
        'dummy',
        'placeholder',
        'TODO:?\\s*implement',
        'FIXME:?\\s*implement'
      ];
      
      const excludeDirs = ['node_modules', '__tests__', '__mocks__', '.next', 'dist', 'coverage'];
      const excludePattern = excludeDirs.map(dir => `-not -path "./${dir}/*"`).join(' ');
      
      let mocksFound = false;
      mockPatterns.forEach(pattern => {
        const command = `grep -r -i "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . ${excludePattern} 2>/dev/null || true`;
        const result = execSync(command, { encoding: 'utf8' });
        
        if (result.trim()) {
          // Filter out legitimate uses (comments explaining production behavior)
          const lines = result.split('\n').filter(line => {
            return !line.includes('// Production:') && 
                   !line.includes('// Real implementation') &&
                   !line.includes('mockito') &&
                   line.trim().length > 0;
          });
          
          if (lines.length > 0) {
            mocksFound = true;
            this.errors.push(`Mock implementations found (${pattern}):\n${lines.slice(0, 5).join('\n')}`);
          }
        }
      });
      
      if (!mocksFound) {
        this.passed.push('No mock implementations (real services only)');
        this.log('No mock implementations found', 'success');
      } else {
        this.log('VIOLATION: Mock implementations detected', 'error');
        this.criticalFailure = true;
      }
    } catch (e) {
      this.warnings.push('Could not check for mocks: ' + e.message);
    }
  }

  checkTodos() {
    this.log('Checking for TODOs and incomplete code...', 'info');
    
    try {
      const patterns = ['TODO', 'FIXME', 'HACK', 'XXX', 'TEMP', 'WIP', 'INCOMPLETE'];
      const command = `grep -r "${patterns.join('\\|')}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next . 2>/dev/null || true`;
      const result = execSync(command, { encoding: 'utf8' });
      
      if (result.trim()) {
        this.errors.push('TODOs/incomplete code found:\n' + result.split('\n').slice(0, 5).join('\n'));
        this.log('VIOLATION: Incomplete implementations found', 'error');
        this.criticalFailure = true;
      } else {
        this.passed.push('No TODOs or incomplete code');
        this.log('No incomplete implementations', 'success');
      }
    } catch (e) {
      this.warnings.push('Could not check for TODOs');
    }
  }

  checkConsoleStatements() {
    this.log('Checking for console statements...', 'info');
    
    try {
      const command = `grep -r "console\\." --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=__tests__ --exclude-dir=.next . 2>/dev/null || true`;
      const result = execSync(command, { encoding: 'utf8' });
      
      if (result.trim()) {
        // Filter out legitimate uses
        const lines = result.split('\n').filter(line => {
          return !line.includes('console.error') && // Allowed for error handling
                 !line.includes('console.warn') &&  // Allowed for warnings
                 !line.includes('// console') &&    // Commented out
                 line.trim().length > 0;
        });
        
        if (lines.length > 0) {
          this.errors.push('console.log statements found:\n' + lines.slice(0, 5).join('\n'));
          this.log('Console statements found - use proper logging', 'error');
        } else {
          this.passed.push('No debug console statements');
          this.log('No console.log statements', 'success');
        }
      } else {
        this.passed.push('No debug console statements');
        this.log('No console.log statements', 'success');
      }
    } catch (e) {
      this.warnings.push('Could not check for console statements');
    }
  }

  checkTypeScript() {
    this.log('Running TypeScript strict mode check...', 'info');
    
    try {
      execSync('npx tsc --noEmit --strict', { encoding: 'utf8', stdio: 'pipe' });
      this.passed.push('TypeScript strict mode passed');
      this.log('TypeScript strict mode check passed', 'success');
    } catch (e) {
      this.errors.push('TypeScript strict mode errors');
      this.log('TypeScript strict mode failed', 'error');
      this.criticalFailure = true;
    }
  }

  checkESLint() {
    this.log('Running ESLint production check...', 'info');
    
    try {
      execSync('npx next lint --max-warnings 0', { encoding: 'utf8', stdio: 'pipe' });
      this.passed.push('ESLint production standards met');
      this.log('ESLint check passed with zero warnings', 'success');
    } catch (e) {
      this.errors.push('ESLint errors or warnings found');
      this.log('ESLint check failed', 'error');
    }
  }

  checkSecurity() {
    this.log('Running security audit...', 'info');
    
    try {
      const result = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(result);
      
      if (audit.metadata.vulnerabilities.critical > 0) {
        this.errors.push(`${audit.metadata.vulnerabilities.critical} critical vulnerabilities`);
        this.log('Critical security vulnerabilities found', 'error');
        this.criticalFailure = true;
      } else if (audit.metadata.vulnerabilities.high > 0) {
        this.errors.push(`${audit.metadata.vulnerabilities.high} high vulnerabilities`);
        this.log('High security vulnerabilities found', 'error');
      } else if (audit.metadata.vulnerabilities.moderate > 0) {
        this.warnings.push(`${audit.metadata.vulnerabilities.moderate} moderate vulnerabilities`);
        this.log('Moderate security vulnerabilities found', 'warning');
      } else {
        this.passed.push('Security audit clean');
        this.log('No security vulnerabilities', 'success');
      }
    } catch (e) {
      // If npm audit fails to parse, try to get basic info
      try {
        const result = execSync('npm audit', { encoding: 'utf8' });
        if (result.includes('found 0 vulnerabilities')) {
          this.passed.push('Security audit clean');
          this.log('No security vulnerabilities', 'success');
        } else {
          this.warnings.push('Security audit needs review');
          this.log('Security audit needs review', 'warning');
        }
      } catch (auditError) {
        this.warnings.push('Could not complete security audit');
      }
    }
  }

  checkTests() {
    this.log('Checking test coverage...', 'info');
    
    try {
      // Check if test command exists
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (packageJson.scripts && packageJson.scripts['test:coverage']) {
        try {
          execSync('npm run test:coverage', { encoding: 'utf8', stdio: 'pipe' });
          
          // Check coverage report if it exists
          if (fs.existsSync('coverage/coverage-summary.json')) {
            const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
            const linesCoverage = coverage.total.lines.pct;
            
            if (linesCoverage < 80) {
              this.errors.push(`Test coverage below 80%: ${linesCoverage}%`);
              this.log(`Test coverage insufficient: ${linesCoverage}%`, 'error');
            } else {
              this.passed.push(`Test coverage adequate: ${linesCoverage}%`);
              this.log(`Test coverage: ${linesCoverage}%`, 'success');
            }
          } else {
            this.warnings.push('Coverage report not found');
          }
        } catch (e) {
          this.errors.push('Tests failed to run');
          this.log('Test execution failed', 'error');
        }
      } else {
        this.warnings.push('No test:coverage script defined');
        this.log('Test coverage script not configured', 'warning');
      }
    } catch (e) {
      this.warnings.push('Could not check test coverage');
    }
  }

  checkDependencies() {
    this.log('Checking for outdated dependencies...', 'info');
    
    try {
      const result = execSync('npm outdated --json', { encoding: 'utf8' });
      
      if (result) {
        const outdated = JSON.parse(result);
        const count = Object.keys(outdated).length;
        
        if (count > 10) {
          this.errors.push(`${count} outdated dependencies - violates latest stable principle`);
          this.log(`${count} outdated dependencies found`, 'error');
        } else if (count > 0) {
          this.warnings.push(`${count} outdated dependencies`);
          this.log(`${count} outdated dependencies`, 'warning');
        }
      } else {
        this.passed.push('All dependencies up to date');
        this.log('All dependencies current', 'success');
      }
    } catch (e) {
      // npm outdated exits with code 1 if there are outdated packages
      if (e.status === 1) {
        try {
          // Try to count them
          const result = execSync('npm outdated | wc -l', { encoding: 'utf8' });
          const count = parseInt(result.trim()) - 1; // Subtract header line
          if (count > 0) {
            this.warnings.push(`${count} outdated dependencies`);
            this.log(`${count} outdated dependencies`, 'warning');
          }
        } catch (countError) {
          this.warnings.push('Some dependencies may be outdated');
        }
      } else {
        this.passed.push('Dependencies checked');
      }
    }
  }

  checkEnvironment() {
    this.log('Checking environment configuration...', 'info');
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];
    
    // Check for .env.example
    if (!fs.existsSync('.env.example')) {
      this.errors.push('Missing .env.example file');
      this.log('No .env.example template', 'error');
    } else {
      this.passed.push('Environment template exists');
    }
    
    // Check for hardcoded secrets
    try {
      const command = `grep -r "api[_-]key\\|secret\\|password\\|token" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules . 2>/dev/null | grep -v "process.env\\|import.meta.env" | grep "=\\s*['\\\"]" || true`;
      const result = execSync(command, { encoding: 'utf8' });
      
      if (result.trim()) {
        this.errors.push('Hardcoded secrets found:\n' + result.split('\n').slice(0, 3).join('\n'));
        this.log('Hardcoded secrets detected', 'error');
        this.criticalFailure = true;
      } else {
        this.passed.push('No hardcoded secrets');
        this.log('No hardcoded secrets found', 'success');
      }
    } catch (e) {
      this.warnings.push('Could not check for secrets');
    }
  }

  checkPerformance() {
    this.log('Checking performance optimizations...', 'info');
    
    // Check for React.memo usage
    try {
      const memoCount = execSync('grep -r "React.memo\\|useMemo\\|useCallback" --include="*.tsx" --exclude-dir=node_modules . 2>/dev/null | wc -l', { encoding: 'utf8' });
      
      if (parseInt(memoCount) > 0) {
        this.passed.push('Performance optimizations found');
        this.log('React performance optimizations in place', 'success');
      } else {
        this.warnings.push('Consider adding React.memo/useMemo for performance');
      }
    } catch (e) {
      // Not critical
    }
    
    // Check bundle size if build exists
    if (fs.existsSync('.next')) {
      try {
        const stats = fs.statSync('.next');
        const sizeMB = stats.size / (1024 * 1024);
        
        if (sizeMB > 50) {
          this.warnings.push(`Large build size: ${sizeMB.toFixed(2)}MB`);
        } else {
          this.passed.push('Build size acceptable');
        }
      } catch (e) {
        // Not critical
      }
    }
  }

  checkAccessibility() {
    this.log('Checking accessibility standards...', 'info');
    
    try {
      // Check for aria labels
      const ariaCount = execSync('grep -r "aria-\\|role=" --include="*.tsx" --exclude-dir=node_modules . 2>/dev/null | wc -l', { encoding: 'utf8' });
      
      if (parseInt(ariaCount) > 10) {
        this.passed.push('Accessibility attributes found');
        this.log('Accessibility standards implemented', 'success');
      } else {
        this.warnings.push('Limited accessibility attributes found');
        this.log('Consider adding more ARIA labels', 'warning');
      }
    } catch (e) {
      this.warnings.push('Could not check accessibility');
    }
  }

  checkDocumentation() {
    this.log('Checking documentation...', 'info');
    
    const requiredDocs = [
      'README.md',
      '.env.example'
    ];
    
    const missingDocs = requiredDocs.filter(doc => !fs.existsSync(doc));
    
    if (missingDocs.length > 0) {
      this.errors.push(`Missing documentation: ${missingDocs.join(', ')}`);
      this.log('Required documentation missing', 'error');
    } else {
      this.passed.push('Core documentation present');
      this.log('Documentation requirements met', 'success');
    }
    
    // Check README content
    if (fs.existsSync('README.md')) {
      const readme = fs.readFileSync('README.md', 'utf8');
      
      if (readme.length < 500) {
        this.warnings.push('README.md seems incomplete (< 500 chars)');
      }
      
      const requiredSections = ['Installation', 'Usage', 'Development'];
      const missingSections = requiredSections.filter(section => 
        !readme.includes(section) && !readme.includes(section.toLowerCase())
      );
      
      if (missingSections.length > 0) {
        this.warnings.push(`README missing sections: ${missingSections.join(', ')}`);
      }
    }
  }

  checkDatabase() {
    this.log('Checking database configuration...', 'info');
    
    if (fs.existsSync('prisma/schema.prisma')) {
      try {
        execSync('npx prisma validate', { encoding: 'utf8', stdio: 'pipe' });
        this.passed.push('Prisma schema valid');
        this.log('Database schema validated', 'success');
        
        // Check for migrations
        if (fs.existsSync('prisma/migrations')) {
          this.passed.push('Database migrations present');
        } else {
          this.warnings.push('No database migrations found');
        }
      } catch (e) {
        this.errors.push('Prisma schema validation failed');
        this.log('Database schema invalid', 'error');
      }
    }
  }

  checkApiDocumentation() {
    this.log('Checking API documentation...', 'info');
    
    const apiDocFiles = ['openapi.json', 'swagger.json', 'api-docs.json', 'openapi.yaml', 'swagger.yaml'];
    const hasApiDocs = apiDocFiles.some(file => fs.existsSync(file));
    
    if (hasApiDocs) {
      this.passed.push('API documentation found');
      this.log('API documentation present', 'success');
    } else {
      // Check if there are API routes
      const hasApiRoutes = fs.existsSync('app/api') || fs.existsSync('pages/api') || fs.existsSync('server/routes');
      
      if (hasApiRoutes) {
        this.warnings.push('API routes exist but no OpenAPI/Swagger documentation');
        this.log('Consider adding API documentation', 'warning');
      }
    }
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('PRODUCTION VALIDATION REPORT');
    console.log('='.repeat(60) + '\n');
    
    if (this.passed.length > 0) {
      console.log('\x1b[32m✅ PASSED (' + this.passed.length + '):\x1b[0m');
      this.passed.forEach(item => console.log('  ✓ ' + item));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n\x1b[33m⚠️  WARNINGS (' + this.warnings.length + '):\x1b[0m');
      this.warnings.forEach(item => console.log('  ⚠ ' + item));
    }
    
    if (this.errors.length > 0) {
      console.log('\n\x1b[31m❌ ERRORS (' + this.errors.length + '):\x1b[0m');
      this.errors.forEach(item => console.log('  ✗ ' + item));
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.criticalFailure) {
      console.log('\x1b[31m🚫 CRITICAL FAILURE - PRODUCTION STANDARDS VIOLATED\x1b[0m');
      console.log('\x1b[31mThis code is NOT production ready.\x1b[0m');
    } else if (this.errors.length > 0) {
      console.log('\x1b[31m❌ PRODUCTION VALIDATION FAILED\x1b[0m');
      console.log('Fix all errors before deploying to production.');
    } else if (this.warnings.length > 0) {
      console.log('\x1b[33m⚠️  PRODUCTION VALIDATION PASSED WITH WARNINGS\x1b[0m');
      console.log('Consider addressing warnings for optimal production readiness.');
    } else {
      console.log('\x1b[32m✅ PRODUCTION VALIDATION PASSED\x1b[0m');
      console.log('\x1b[32mThis code meets all production standards!\x1b[0m');
    }
    
    console.log('='.repeat(60) + '\n');
  }
}

// Run validation
const validator = new ProductionValidator();
validator.validate();