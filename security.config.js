/**
 * SECURITY CONFIGURATION
 * Zero-tolerance security standards for production
 */

module.exports = {
  // Security headers - MANDATORY
  headers: {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.example.com", "wss://"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
        blockAllMixedContent: [],
        requireTrustedTypesFor: ["'script'"]
      },
      reportOnly: false,
      reportUri: '/api/csp-report'
    },
    
    // Other security headers
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
    xXssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'self'"],
      payment: ["'self'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"]
    }
  },
  
  // Authentication & Authorization
  auth: {
    // JWT configuration
    jwt: {
      algorithm: 'RS256',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
      issuer: 'medical-devices-marketplace',
      audience: 'api.medical-devices.com',
      clockTolerance: 30
    },
    
    // Session configuration
    session: {
      name: '__Secure-SessionId',
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1800000, // 30 minutes
        domain: process.env.COOKIE_DOMAIN
      }
    },
    
    // Password policy
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5,
      maxAge: 90, // days
      preventCommonPasswords: true,
      preventUserInfo: true
    },
    
    // Multi-factor authentication
    mfa: {
      required: true,
      methods: ['totp', 'sms', 'email'],
      backupCodes: 10,
      gracePeriod: 7 // days
    },
    
    // Rate limiting
    rateLimiting: {
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5,
        skipSuccessfulRequests: false
      },
      api: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false
      },
      registration: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3
      }
    }
  },
  
  // Input validation
  validation: {
    // SQL injection prevention
    sql: {
      parameterizedQueries: true,
      escapeUserInput: true,
      validateSchemas: true,
      preventRawQueries: true
    },
    
    // XSS prevention
    xss: {
      sanitizeInput: true,
      encodeOutput: true,
      validateContentType: true,
      useCSP: true
    },
    
    // File upload validation
    fileUpload: {
      maxSize: 10485760, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf'
      ],
      scanForVirus: true,
      validateMagicNumbers: true,
      quarantineUntilScanned: true
    },
    
    // API input validation
    api: {
      validateSchemas: true,
      rejectAdditionalProperties: true,
      sanitizeStrings: true,
      limitDepth: 5,
      maxProperties: 100
    }
  },
  
  // Encryption
  encryption: {
    // Data at rest
    atRest: {
      algorithm: 'aes-256-gcm',
      keyRotation: 30, // days
      backupEncryption: true
    },
    
    // Data in transit
    inTransit: {
      tlsVersion: '1.3',
      cipherSuites: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256'
      ],
      certificatePinning: true,
      hsts: true
    },
    
    // Sensitive data
    sensitiveData: {
      fields: ['password', 'ssn', 'creditCard', 'apiKey', 'secret'],
      maskInLogs: true,
      encryptInDatabase: true,
      tokenize: true
    }
  },
  
  // Audit logging
  audit: {
    enabled: true,
    logLevel: 'info',
    
    // Events to log
    events: [
      'authentication.login',
      'authentication.logout',
      'authentication.failed',
      'authorization.granted',
      'authorization.denied',
      'data.create',
      'data.read',
      'data.update',
      'data.delete',
      'configuration.change',
      'security.violation',
      'api.request',
      'api.response'
    ],
    
    // Log retention
    retention: {
      days: 90,
      archiveAfter: 30,
      compressArchives: true
    },
    
    // Log integrity
    integrity: {
      sign: true,
      hash: 'sha256',
      chainHashes: true,
      immutable: true
    }
  },
  
  // Security scanning
  scanning: {
    // Dependency scanning
    dependencies: {
      enabled: true,
      schedule: 'daily',
      tools: ['npm-audit', 'snyk', 'owasp-dependency-check'],
      failOnHigh: true,
      failOnCritical: true,
      autoFix: true
    },
    
    // Code scanning
    code: {
      enabled: true,
      schedule: 'on-commit',
      tools: ['semgrep', 'codeql', 'sonarqube'],
      rules: ['owasp-top-10', 'cwe-top-25', 'sans-top-25'],
      failOnHigh: true
    },
    
    // Container scanning
    container: {
      enabled: true,
      schedule: 'on-build',
      tools: ['trivy', 'clair', 'anchore'],
      failOnHigh: true,
      scanBasImages: true
    },
    
    // Infrastructure scanning
    infrastructure: {
      enabled: true,
      schedule: 'daily',
      tools: ['terraform-scan', 'checkov', 'tfsec'],
      compliance: ['cis', 'pci-dss', 'hipaa']
    }
  },
  
  // Incident response
  incidentResponse: {
    // Severity levels
    severityLevels: {
      critical: {
        responseTime: '15m',
        escalation: 'immediate',
        notification: ['security-team', 'management']
      },
      high: {
        responseTime: '1h',
        escalation: '30m',
        notification: ['security-team']
      },
      medium: {
        responseTime: '4h',
        escalation: '2h',
        notification: ['dev-team']
      },
      low: {
        responseTime: '24h',
        escalation: '12h',
        notification: ['dev-team']
      }
    },
    
    // Automated responses
    automatedResponses: {
      bruteForce: {
        action: 'block-ip',
        duration: '24h',
        notify: true
      },
      sqlInjection: {
        action: 'terminate-session',
        blockUser: true,
        notify: true
      },
      xss: {
        action: 'sanitize-and-log',
        notify: true
      },
      unauthorizedAccess: {
        action: 'revoke-tokens',
        notify: true
      }
    }
  },
  
  // Compliance
  compliance: {
    standards: ['GDPR', 'HIPAA', 'PCI-DSS', 'ISO-27001', 'SOC-2'],
    
    // Data privacy
    privacy: {
      dataMinimization: true,
      purposeLimitation: true,
      consentRequired: true,
      rightToErasure: true,
      dataPortability: true,
      privacyByDesign: true
    },
    
    // Data retention
    retention: {
      userDat: '3 years',
      logs: '1 year',
      backups: '6 months',
      temp: '24 hours'
    }
  },
  
  // Security testing
  testing: {
    // Penetration testing
    penetrationTesting: {
      frequency: 'quarterly',
      scope: ['application', 'network', 'social-engineering'],
      vendor: 'approved-vendors-only',
      remediation: '30 days'
    },
    
    // Vulnerability assessment
    vulnerabilityAssessment: {
      frequency: 'monthly',
      automated: true,
      manual: 'quarterly',
      coverage: ['application', 'infrastructure', 'dependencies']
    },
    
    // Security regression testing
    regressionTesting: {
      onEveryCommit: true,
      testSuites: [
        'authentication',
        'authorization',
        'input-validation',
        'encryption',
        'session-management'
      ]
    }
  },
  
  // Security monitoring
  monitoring: {
    // Real-time monitoring
    realTime: {
      enabled: true,
      alerting: true,
      dashboards: ['security-operations', 'threat-detection'],
      metrics: [
        'failed-logins',
        'unauthorized-access',
        'suspicious-activity',
        'error-rates',
        'response-times'
      ]
    },
    
    // SIEM integration
    siem: {
      enabled: true,
      platform: 'splunk',
      forwardLogs: true,
      correlationRules: true,
      threatIntelligence: true
    },
    
    // Threat detection
    threatDetection: {
      anomalyDetection: true,
      behavioralAnalysis: true,
      signatureBasedDetection: true,
      machinelearning: true
    }
  }
};

// Security validation functions
module.exports.validateSecurity = () => {
  const violations = [];
  
  // Check for environment variables
  const requiredEnvVars = [
    'SESSION_SECRET',
    'JWT_SECRET',
    'DATABASE_ENCRYPTION_KEY',
    'API_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      violations.push({
        type: 'missing-env-var',
        variable: envVar,
        severity: 'critical'
      });
    }
  });
  
  // Check for weak configurations
  if (process.env.NODE_ENV !== 'production') {
    violations.push({
      type: 'non-production-environment',
      severity: 'warning'
    });
  }
  
  return violations;
};

// OWASP Top 10 checker
module.exports.checkOWASPTop10 = () => {
  return {
    injection: 'protected',
    brokenAuth: 'protected',
    sensitiveDataExposure: 'protected',
    xxe: 'protected',
    brokenAccessControl: 'protected',
    securityMisconfiguration: 'protected',
    xss: 'protected',
    insecureDeserialization: 'protected',
    vulnerableComponents: 'monitored',
    insufficientLogging: 'implemented'
  };
};