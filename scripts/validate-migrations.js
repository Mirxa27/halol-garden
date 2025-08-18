#!/usr/bin/env node

/**
 * DATABASE MIGRATION VALIDATION
 * Ensures all migrations are production-ready with rollback capability
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MigrationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
  }

  log(message, type = 'info') {
    const colors = {
      error: '\x1b[31m',
      warning: '\x1b[33m',
      success: '\x1b[32m',
      info: '\x1b[36m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async validate() {
    this.log('\n🔍 DATABASE MIGRATION VALIDATION\n', 'info');
    
    // Run all validation checks
    this.checkMigrationFiles();
    this.checkMigrationNaming();
    this.checkMigrationContent();
    this.checkRollbackCapability();
    this.checkDataIntegrity();
    this.checkPerformance();
    this.checkDependencies();
    this.validateSchema();
    this.checkIndexes();
    this.checkConstraints();
    
    // Print report
    this.printReport();
    
    // Exit with appropriate code
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }

  checkMigrationFiles() {
    this.log('Checking migration files...', 'info');
    
    if (!fs.existsSync(this.migrationsPath)) {
      this.errors.push('No migrations directory found');
      return;
    }
    
    const migrations = fs.readdirSync(this.migrationsPath)
      .filter(file => fs.statSync(path.join(this.migrationsPath, file)).isDirectory());
    
    if (migrations.length === 0) {
      this.warnings.push('No migrations found');
      return;
    }
    
    // Check each migration
    migrations.forEach(migration => {
      const migrationPath = path.join(this.migrationsPath, migration);
      const files = fs.readdirSync(migrationPath);
      
      // Must have migration.sql
      if (!files.includes('migration.sql')) {
        this.errors.push(`Missing migration.sql in ${migration}`);
      }
      
      // Should have a README
      if (!files.includes('README.md')) {
        this.warnings.push(`Missing README.md in ${migration}`);
      }
    });
    
    this.passed.push(`${migrations.length} migrations found`);
  }

  checkMigrationNaming() {
    this.log('Checking migration naming conventions...', 'info');
    
    if (!fs.existsSync(this.migrationsPath)) return;
    
    const migrations = fs.readdirSync(this.migrationsPath)
      .filter(file => fs.statSync(path.join(this.migrationsPath, file)).isDirectory());
    
    const validPattern = /^\d{14}_[a-z_]+$/;
    
    migrations.forEach(migration => {
      if (!validPattern.test(migration)) {
        this.errors.push(`Invalid migration name format: ${migration}`);
      }
    });
    
    this.passed.push('Migration naming conventions checked');
  }

  checkMigrationContent() {
    this.log('Checking migration content...', 'info');
    
    if (!fs.existsSync(this.migrationsPath)) return;
    
    const migrations = fs.readdirSync(this.migrationsPath)
      .filter(file => fs.statSync(path.join(this.migrationsPath, file)).isDirectory());
    
    migrations.forEach(migration => {
      const sqlPath = path.join(this.migrationsPath, migration, 'migration.sql');
      
      if (fs.existsSync(sqlPath)) {
        const content = fs.readFileSync(sqlPath, 'utf8');
        
        // Check for dangerous operations
        if (content.includes('DROP TABLE') && !content.includes('IF EXISTS')) {
          this.warnings.push(`Unsafe DROP TABLE in ${migration}`);
        }
        
        if (content.includes('TRUNCATE')) {
          this.warnings.push(`TRUNCATE operation in ${migration}`);
        }
        
        if (content.includes('DELETE FROM') && !content.includes('WHERE')) {
          this.errors.push(`Unsafe DELETE without WHERE in ${migration}`);
        }
        
        // Check for transactions
        if (!content.includes('BEGIN') && !content.includes('COMMIT')) {
          this.warnings.push(`No explicit transaction in ${migration}`);
        }
        
        // Check for comments
        if (!content.includes('--') && !content.includes('/*')) {
          this.warnings.push(`No comments in ${migration}`);
        }
        
        // Check for data migrations
        if (content.includes('INSERT') || content.includes('UPDATE')) {
          if (!content.includes('WHERE')) {
            this.warnings.push(`Data migration without WHERE clause in ${migration}`);
          }
        }
      }
    });
    
    this.passed.push('Migration content validated');
  }

  checkRollbackCapability() {
    this.log('Checking rollback capability...', 'info');
    
    if (!fs.existsSync(this.migrationsPath)) return;
    
    const migrations = fs.readdirSync(this.migrationsPath)
      .filter(file => fs.statSync(path.join(this.migrationsPath, file)).isDirectory());
    
    migrations.forEach(migration => {
      const rollbackPath = path.join(this.migrationsPath, migration, 'rollback.sql');
      
      if (!fs.existsSync(rollbackPath)) {
        // Check if migration is reversible
        const sqlPath = path.join(this.migrationsPath, migration, 'migration.sql');
        if (fs.existsSync(sqlPath)) {
          const content = fs.readFileSync(sqlPath, 'utf8');
          
          // Non-reversible operations
          if (content.includes('DROP COLUMN') || 
              content.includes('DROP TABLE') ||
              content.includes('RENAME') ||
              content.includes('ALTER TYPE')) {
            this.errors.push(`Non-reversible migration without rollback script: ${migration}`);
          } else {
            this.warnings.push(`Missing rollback script for ${migration}`);
          }
        }
      } else {
        // Validate rollback script
        const rollbackContent = fs.readFileSync(rollbackPath, 'utf8');
        
        if (rollbackContent.length < 10) {
          this.errors.push(`Empty or invalid rollback script in ${migration}`);
        }
        
        this.passed.push(`Rollback script found for ${migration}`);
      }
    });
  }

  checkDataIntegrity() {
    this.log('Checking data integrity constraints...', 'info');
    
    // Check for foreign key constraints
    try {
      const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
      
      // Check for missing foreign keys
      const relations = schema.match(/@relation/g);
      if (!relations || relations.length === 0) {
        this.warnings.push('No foreign key relationships defined');
      }
      
      // Check for unique constraints
      const uniques = schema.match(/@unique/g);
      if (!uniques || uniques.length === 0) {
        this.warnings.push('No unique constraints defined');
      }
      
      // Check for indexes
      const indexes = schema.match(/@@index/g);
      if (!indexes || indexes.length === 0) {
        this.warnings.push('No indexes defined');
      }
      
      this.passed.push('Data integrity constraints checked');
    } catch (e) {
      this.errors.push('Could not read schema.prisma');
    }
  }

  checkPerformance() {
    this.log('Checking migration performance impact...', 'info');
    
    if (!fs.existsSync(this.migrationsPath)) return;
    
    const migrations = fs.readdirSync(this.migrationsPath)
      .filter(file => fs.statSync(path.join(this.migrationsPath, file)).isDirectory());
    
    migrations.forEach(migration => {
      const sqlPath = path.join(this.migrationsPath, migration, 'migration.sql');
      
      if (fs.existsSync(sqlPath)) {
        const content = fs.readFileSync(sqlPath, 'utf8');
        
        // Check for operations that lock tables
        if (content.includes('ALTER TABLE') && !content.includes('CONCURRENTLY')) {
          this.warnings.push(`Table lock operation in ${migration}`);
        }
        
        // Check for large data operations
        if (content.includes('UPDATE') && !content.includes('LIMIT')) {
          this.warnings.push(`Unbounded UPDATE in ${migration}`);
        }
        
        // Check for missing indexes on foreign keys
        if (content.includes('REFERENCES') && !content.includes('INDEX')) {
          this.warnings.push(`Foreign key without index in ${migration}`);
        }
      }
    });
    
    this.passed.push('Performance impact assessed');
  }

  checkDependencies() {
    this.log('Checking migration dependencies...', 'info');
    
    // Check if migrations are in correct order
    if (!fs.existsSync(this.migrationsPath)) return;
    
    const migrations = fs.readdirSync(this.migrationsPath)
      .filter(file => fs.statSync(path.join(this.migrationsPath, file)).isDirectory())
      .sort();
    
    // Check for timestamp gaps
    for (let i = 1; i < migrations.length; i++) {
      const prev = parseInt(migrations[i - 1].split('_')[0]);
      const curr = parseInt(migrations[i].split('_')[0]);
      
      if (curr <= prev) {
        this.errors.push(`Migration order issue: ${migrations[i]} should come after ${migrations[i - 1]}`);
      }
    }
    
    this.passed.push('Migration dependencies validated');
  }

  validateSchema() {
    this.log('Validating Prisma schema...', 'info');
    
    try {
      execSync('npx prisma validate', { stdio: 'pipe' });
      this.passed.push('Prisma schema is valid');
    } catch (e) {
      this.errors.push('Prisma schema validation failed');
    }
    
    // Check for required fields
    try {
      const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
      
      // Check for audit fields
      if (!schema.includes('createdAt') || !schema.includes('updatedAt')) {
        this.warnings.push('Missing audit timestamp fields');
      }
      
      // Check for soft delete
      if (!schema.includes('deletedAt')) {
        this.warnings.push('No soft delete implementation');
      }
      
      // Check for versioning
      if (!schema.includes('version')) {
        this.warnings.push('No versioning field for optimistic locking');
      }
    } catch (e) {
      // Schema file not found
    }
  }

  checkIndexes() {
    this.log('Checking database indexes...', 'info');
    
    try {
      const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
      
      // Extract models
      const models = schema.match(/model\s+(\w+)\s*{[^}]+}/g) || [];
      
      models.forEach(modelBlock => {
        const modelName = modelBlock.match(/model\s+(\w+)/)[1];
        
        // Check for indexes on commonly queried fields
        const fields = modelBlock.match(/(\w+)\s+\w+/g) || [];
        const indexes = modelBlock.match(/@@index/g) || [];
        
        // Common fields that should be indexed
        const shouldIndex = ['email', 'username', 'slug', 'status', 'type', 'userId', 'createdAt'];
        
        shouldIndex.forEach(field => {
          if (modelBlock.includes(field) && indexes.length === 0) {
            this.warnings.push(`Model ${modelName} may need index on ${field}`);
          }
        });
      });
      
      this.passed.push('Index analysis complete');
    } catch (e) {
      this.warnings.push('Could not analyze indexes');
    }
  }

  checkConstraints() {
    this.log('Checking database constraints...', 'info');
    
    try {
      const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
      
      // Check for proper constraints
      const models = schema.match(/model\s+(\w+)\s*{[^}]+}/g) || [];
      
      models.forEach(modelBlock => {
        const modelName = modelBlock.match(/model\s+(\w+)/)[1];
        
        // Check for primary key
        if (!modelBlock.includes('@id') && !modelBlock.includes('@@id')) {
          this.errors.push(`Model ${modelName} missing primary key`);
        }
        
        // Check for proper field types
        if (modelBlock.includes('String') && !modelBlock.includes('@db.')) {
          this.warnings.push(`Model ${modelName} uses generic String type without database-specific type`);
        }
        
        // Check for validation
        if (!modelBlock.includes('@default') && !modelBlock.includes('?')) {
          this.warnings.push(`Model ${modelName} has required fields without defaults`);
        }
      });
      
      this.passed.push('Constraints validated');
    } catch (e) {
      this.warnings.push('Could not validate constraints');
    }
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION VALIDATION REPORT');
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
    
    if (this.errors.length > 0) {
      console.log('\x1b[31m❌ MIGRATION VALIDATION FAILED\x1b[0m');
      console.log('Fix all errors before running migrations in production.');
    } else if (this.warnings.length > 0) {
      console.log('\x1b[33m⚠️  MIGRATION VALIDATION PASSED WITH WARNINGS\x1b[0m');
      console.log('Review warnings before production deployment.');
    } else {
      console.log('\x1b[32m✅ MIGRATION VALIDATION PASSED\x1b[0m');
      console.log('Migrations are production-ready!');
    }
    
    console.log('='.repeat(60) + '\n');
  }
}

// Run validation
const validator = new MigrationValidator();
validator.validate();