#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Deployment Readiness Check\n');

const checks = {
  passed: [],
  warnings: [],
  errors: [],
};

// Check 1: Environment variables
console.log('1️⃣  Checking environment variables...');
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
];

const envExample = fs.readFileSync('.env.example', 'utf8');
const envVars = envExample.match(/^[A-Z_]+(?==)/gm) || [];

requiredEnvVars.forEach(varName => {
  if (!envVars.includes(varName)) {
    checks.warnings.push(`${varName} not found in .env.example`);
  }
});

if (fs.existsSync('.env')) {
  checks.passed.push('✅ .env file exists');
} else {
  checks.errors.push('❌ .env file not found');
}

// Check 2: Database connection
console.log('2️⃣  Checking database...');
try {
  execSync('npx prisma db pull --force', { stdio: 'ignore' });
  checks.passed.push('✅ Database connection successful');
} catch (error) {
  checks.errors.push('❌ Database connection failed');
}

// Check 3: Dependencies
console.log('3️⃣  Checking dependencies...');
try {
  const packageJson = require('../package.json');
  const hasAllDeps = [
    '@prisma/client',
    'next',
    'react',
    'next-auth',
    'stripe',
    'nodemailer',
  ].every(dep => packageJson.dependencies[dep]);

  if (hasAllDeps) {
    checks.passed.push('✅ All core dependencies installed');
  } else {
    checks.errors.push('❌ Missing core dependencies');
  }
} catch (error) {
  checks.errors.push('❌ Could not read package.json');
}

// Check 4: Build process
console.log('4️⃣  Checking build...');
try {
  console.log('   Running build (this may take a moment)...');
  execSync('npm run build', { stdio: 'ignore' });
  checks.passed.push('✅ Build successful');
} catch (error) {
  checks.errors.push('❌ Build failed');
}

// Check 5: TypeScript
console.log('5️⃣  Checking TypeScript...');
try {
  execSync('npm run type-check', { stdio: 'ignore' });
  checks.passed.push('✅ TypeScript check passed');
} catch (error) {
  checks.warnings.push('⚠️  TypeScript errors found');
}

// Check 6: Linting
console.log('6️⃣  Checking code quality...');
try {
  execSync('npm run lint', { stdio: 'ignore' });
  checks.passed.push('✅ Linting passed');
} catch (error) {
  checks.warnings.push('⚠️  Linting warnings found');
}

// Check 7: Security audit
console.log('7️⃣  Checking security...');
try {
  const auditResult = execSync('npm audit --production', { encoding: 'utf8' });
  if (auditResult.includes('found 0 vulnerabilities')) {
    checks.passed.push('✅ No security vulnerabilities');
  } else {
    checks.warnings.push('⚠️  Security vulnerabilities found (run npm audit)');
  }
} catch (error) {
  checks.warnings.push('⚠️  Could not complete security audit');
}

// Check 8: Required files
console.log('8️⃣  Checking required files...');
const requiredFiles = [
  'prisma/schema.prisma',
  'next.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  '.gitignore',
  'README.md',
];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    checks.errors.push(`❌ Missing required file: ${file}`);
  }
});

if (requiredFiles.every(file => fs.existsSync(file))) {
  checks.passed.push('✅ All required files present');
}

// Check 9: API endpoints
console.log('9️⃣  Checking API endpoints...');
const apiDir = path.join(__dirname, '../app/api');
const requiredEndpoints = [
  'auth/[...nextauth]',
  'products',
  'orders',
  'cart',
  'payments',
];

requiredEndpoints.forEach(endpoint => {
  const endpointPath = path.join(apiDir, endpoint, 'route.ts');
  if (!fs.existsSync(endpointPath)) {
    checks.warnings.push(`⚠️  Missing API endpoint: ${endpoint}`);
  }
});

// Check 10: Production readiness
console.log('🔟 Checking production readiness...');
try {
  const validationResult = execSync('node scripts/validate-production.js', { encoding: 'utf8' });
  if (validationResult.includes('✅ All checks passed')) {
    checks.passed.push('✅ Production validation passed');
  } else {
    checks.warnings.push('⚠️  Production validation has warnings');
  }
} catch (error) {
  checks.errors.push('❌ Production validation failed');
}

// Summary
console.log('\n📊 Deployment Readiness Summary\n');

console.log(`✅ Passed: ${checks.passed.length}`);
checks.passed.forEach(check => console.log(`   ${check}`));

if (checks.warnings.length > 0) {
  console.log(`\n⚠️  Warnings: ${checks.warnings.length}`);
  checks.warnings.forEach(warning => console.log(`   ${warning}`));
}

if (checks.errors.length > 0) {
  console.log(`\n❌ Errors: ${checks.errors.length}`);
  checks.errors.forEach(error => console.log(`   ${error}`));
}

// Final verdict
console.log('\n🎯 Final Verdict:');
if (checks.errors.length === 0) {
  if (checks.warnings.length === 0) {
    console.log('   ✅ READY FOR DEPLOYMENT! 🚀');
  } else {
    console.log('   ⚠️  READY WITH WARNINGS - Review warnings before deploying');
  }
  process.exit(0);
} else {
  console.log('   ❌ NOT READY - Fix errors before deploying');
  process.exit(1);
}