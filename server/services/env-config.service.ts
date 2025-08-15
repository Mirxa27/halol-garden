import { prisma } from '../config/database';
import { CacheService, CacheKeys, CacheTTL } from '../config/redis';
import crypto from 'crypto';
import axios from 'axios';

interface EnvVariable {
  key: string;
  value: string;
  description?: string;
  category: EnvCategory;
  required: boolean;
  encrypted: boolean;
  validation?: EnvValidation;
  lastModified?: Date;
  modifiedBy?: string;
}

interface EnvValidation {
  type: 'string' | 'number' | 'boolean' | 'url' | 'email' | 'regex';
  pattern?: string;
  min?: number;
  max?: number;
  options?: string[];
}

enum EnvCategory {
  DATABASE = 'Database',
  AI_PROVIDERS = 'AI Providers',
  PAYMENTS = 'Payments',
  EMAIL = 'Email',
  SITE_BRANDING = 'Site Branding',
  AUTHENTICATION = 'Authentication',
  STORAGE = 'Storage',
  MONITORING = 'Monitoring',
  OTHER = 'Other Services'
}

interface EnvSnapshot {
  id: string;
  variables: EnvVariable[];
  createdAt: Date;
  createdBy: string;
  description: string;
  isActive: boolean;
}

interface ProviderConfig {
  name: string;
  category: EnvCategory;
  requiredKeys: string[];
  optionalKeys?: string[];
  testEndpoint?: string;
  models?: string[];
}

export class EnvConfigService {
  private static readonly ENCRYPTION_KEY = process.env.ENV_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  private static readonly VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
  private static readonly VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
  private static readonly VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

  /**
   * Get environment variable schema
   */
  static getEnvSchema(): Record<string, Partial<EnvVariable>> {
    return {
      // Database
      DATABASE_URL: {
        description: 'PostgreSQL connection string',
        category: EnvCategory.DATABASE,
        required: true,
        encrypted: true,
        validation: {
          type: 'string',
          pattern: '^postgresql://'
        }
      },
      REDIS_URL: {
        description: 'Redis connection string',
        category: EnvCategory.DATABASE,
        required: true,
        encrypted: true,
        validation: {
          type: 'string',
          pattern: '^redis://'
        }
      },

      // Authentication
      JWT_SECRET: {
        description: 'Secret key for JWT token generation',
        category: EnvCategory.AUTHENTICATION,
        required: true,
        encrypted: true,
        validation: {
          type: 'string',
          min: 32
        }
      },
      JWT_REFRESH_SECRET: {
        description: 'Secret key for refresh token generation',
        category: EnvCategory.AUTHENTICATION,
        required: true,
        encrypted: true,
        validation: {
          type: 'string',
          min: 32
        }
      },
      SESSION_SECRET: {
        description: 'Secret key for session management',
        category: EnvCategory.AUTHENTICATION,
        required: true,
        encrypted: true,
        validation: {
          type: 'string',
          min: 32
        }
      },

      // AI Providers - OpenAI
      OPENAI_API_KEY: {
        description: 'OpenAI API key for GPT models',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: true,
        validation: {
          type: 'string',
          pattern: '^sk-'
        }
      },
      OPENAI_ORG_ID: {
        description: 'OpenAI organization ID',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: false
      },
      OPENAI_MODEL: {
        description: 'Default OpenAI model to use',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: false,
        validation: {
          type: 'string',
          options: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
        }
      },

      // AI Providers - Google Gemini
      GEMINI_API_KEY: {
        description: 'Google Gemini API key',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: true
      },
      GEMINI_MODEL: {
        description: 'Default Gemini model',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: false,
        validation: {
          type: 'string',
          options: ['gemini-pro', 'gemini-pro-vision']
        }
      },

      // AI Providers - ElevenLabs
      ELEVENLABS_API_KEY: {
        description: 'ElevenLabs API key for voice synthesis',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: true
      },
      ELEVENLABS_VOICE_ID: {
        description: 'Default ElevenLabs voice ID',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: false
      },

      // AI Providers - LiveKit
      LIVEKIT_API_KEY: {
        description: 'LiveKit API key for real-time communication',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: true
      },
      LIVEKIT_API_SECRET: {
        description: 'LiveKit API secret',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: true
      },
      LIVEKIT_URL: {
        description: 'LiveKit server URL',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: false,
        validation: {
          type: 'url'
        }
      },

      // AI Providers - Deepgram
      DEEPGRAM_API_KEY: {
        description: 'Deepgram API key for speech recognition',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: true
      },

      // AI Providers - Hume
      HUME_API_KEY: {
        description: 'Hume API key for emotion AI',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: true
      },
      HUME_SECRET_KEY: {
        description: 'Hume secret key',
        category: EnvCategory.AI_PROVIDERS,
        required: false,
        encrypted: true
      },

      // Payments - PayPal
      PAYPAL_CLIENT_ID: {
        description: 'PayPal client ID',
        category: EnvCategory.PAYMENTS,
        required: true,
        encrypted: false
      },
      PAYPAL_CLIENT_SECRET: {
        description: 'PayPal client secret',
        category: EnvCategory.PAYMENTS,
        required: true,
        encrypted: true
      },
      PAYPAL_MODE: {
        description: 'PayPal environment mode',
        category: EnvCategory.PAYMENTS,
        required: true,
        encrypted: false,
        validation: {
          type: 'string',
          options: ['sandbox', 'production']
        }
      },

      // Payments - MyFatoorah
      MYFATOORAH_API_KEY: {
        description: 'MyFatoorah API key',
        category: EnvCategory.PAYMENTS,
        required: false,
        encrypted: true
      },
      MYFATOORAH_BASE_URL: {
        description: 'MyFatoorah API base URL',
        category: EnvCategory.PAYMENTS,
        required: false,
        encrypted: false,
        validation: {
          type: 'url'
        }
      },
      MYFATOORAH_MODE: {
        description: 'MyFatoorah environment mode',
        category: EnvCategory.PAYMENTS,
        required: false,
        encrypted: false,
        validation: {
          type: 'string',
          options: ['test', 'live']
        }
      },

      // Email
      EMAIL_HOST: {
        description: 'SMTP server host',
        category: EnvCategory.EMAIL,
        required: true,
        encrypted: false
      },
      EMAIL_PORT: {
        description: 'SMTP server port',
        category: EnvCategory.EMAIL,
        required: true,
        encrypted: false,
        validation: {
          type: 'number',
          min: 1,
          max: 65535
        }
      },
      EMAIL_USER: {
        description: 'SMTP username',
        category: EnvCategory.EMAIL,
        required: true,
        encrypted: false,
        validation: {
          type: 'email'
        }
      },
      EMAIL_PASSWORD: {
        description: 'SMTP password',
        category: EnvCategory.EMAIL,
        required: true,
        encrypted: true
      },
      EMAIL_FROM: {
        description: 'Default sender email address',
        category: EnvCategory.EMAIL,
        required: true,
        encrypted: false
      },

      // Site Branding
      SITE_NAME: {
        description: 'Website name',
        category: EnvCategory.SITE_BRANDING,
        required: true,
        encrypted: false
      },
      SITE_URL: {
        description: 'Website URL',
        category: EnvCategory.SITE_BRANDING,
        required: true,
        encrypted: false,
        validation: {
          type: 'url'
        }
      },
      SITE_LOGO_URL: {
        description: 'Website logo URL',
        category: EnvCategory.SITE_BRANDING,
        required: false,
        encrypted: false,
        validation: {
          type: 'url'
        }
      },
      SITE_DESCRIPTION: {
        description: 'Website description for SEO',
        category: EnvCategory.SITE_BRANDING,
        required: false,
        encrypted: false
      },

      // Storage
      UPLOAD_DIR: {
        description: 'Directory for file uploads',
        category: EnvCategory.STORAGE,
        required: true,
        encrypted: false
      },
      MAX_FILE_SIZE: {
        description: 'Maximum file upload size in bytes',
        category: EnvCategory.STORAGE,
        required: true,
        encrypted: false,
        validation: {
          type: 'number',
          min: 1048576, // 1MB
          max: 104857600 // 100MB
        }
      },

      // Monitoring
      SENTRY_DSN: {
        description: 'Sentry error tracking DSN',
        category: EnvCategory.MONITORING,
        required: false,
        encrypted: false,
        validation: {
          type: 'url'
        }
      },
      GOOGLE_ANALYTICS_ID: {
        description: 'Google Analytics tracking ID',
        category: EnvCategory.MONITORING,
        required: false,
        encrypted: false,
        validation: {
          type: 'string',
          pattern: '^(UA-|G-)'
        }
      },

      // Vercel Integration
      VERCEL_API_TOKEN: {
        description: 'Vercel API token for deployment management',
        category: EnvCategory.OTHER,
        required: false,
        encrypted: true
      },
      VERCEL_PROJECT_ID: {
        description: 'Vercel project ID',
        category: EnvCategory.OTHER,
        required: false,
        encrypted: false
      },
      VERCEL_TEAM_ID: {
        description: 'Vercel team ID (optional)',
        category: EnvCategory.OTHER,
        required: false,
        encrypted: false
      }
    };
  }

  /**
   * Get all environment variables (grouped by category)
   */
  static async getAllVariables(includeValues: boolean = false): Promise<Record<EnvCategory, EnvVariable[]>> {
    const schema = this.getEnvSchema();
    const grouped: Record<EnvCategory, EnvVariable[]> = {
      [EnvCategory.DATABASE]: [],
      [EnvCategory.AI_PROVIDERS]: [],
      [EnvCategory.PAYMENTS]: [],
      [EnvCategory.EMAIL]: [],
      [EnvCategory.SITE_BRANDING]: [],
      [EnvCategory.AUTHENTICATION]: [],
      [EnvCategory.STORAGE]: [],
      [EnvCategory.MONITORING]: [],
      [EnvCategory.OTHER]: []
    };

    for (const [key, config] of Object.entries(schema)) {
      const value = includeValues ? process.env[key] : undefined;
      const variable: EnvVariable = {
        key,
        value: value || '',
        description: config.description,
        category: config.category || EnvCategory.OTHER,
        required: config.required || false,
        encrypted: config.encrypted || false,
        validation: config.validation
      };

      // Mask sensitive values
      if (includeValues && config.encrypted && value) {
        variable.value = this.maskSensitiveValue(value);
      }

      grouped[variable.category].push(variable);
    }

    return grouped;
  }

  /**
   * Update environment variable
   */
  static async updateVariable(
    key: string,
    value: string,
    userId: string
  ): Promise<void> {
    const schema = this.getEnvSchema();
    const config = schema[key];

    if (!config) {
      throw new Error(`Unknown environment variable: ${key}`);
    }

    // Validate the value
    if (config.validation) {
      this.validateValue(value, config.validation);
    }

    // Encrypt sensitive values before storing
    const finalValue = config.encrypted ? this.encrypt(value) : value;

    // Store in database
    await prisma.$executeRaw`
      INSERT INTO env_variables (key, value, encrypted, modified_by, modified_at)
      VALUES (${key}, ${finalValue}, ${config.encrypted}, ${userId}, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = ${finalValue}, modified_by = ${userId}, modified_at = NOW()
    `;

    // Update in Vercel if configured
    if (this.VERCEL_API_TOKEN && this.VERCEL_PROJECT_ID) {
      await this.updateVercelEnv(key, value);
    }

    // Clear cache
    await CacheService.delete(`${CacheKeys.SETTINGS}env`);

    // Update process.env for immediate effect
    process.env[key] = value;
  }

  /**
   * Delete environment variable
   */
  static async deleteVariable(key: string, userId: string): Promise<void> {
    const schema = this.getEnvSchema();
    const config = schema[key];

    if (config?.required) {
      throw new Error(`Cannot delete required environment variable: ${key}`);
    }

    // Delete from database
    await prisma.$executeRaw`
      DELETE FROM env_variables WHERE key = ${key}
    `;

    // Delete from Vercel if configured
    if (this.VERCEL_API_TOKEN && this.VERCEL_PROJECT_ID) {
      await this.deleteVercelEnv(key);
    }

    // Clear from process.env
    delete process.env[key];

    // Clear cache
    await CacheService.delete(`${CacheKeys.SETTINGS}env`);
  }

  /**
   * Create environment snapshot for backup
   */
  static async createSnapshot(
    description: string,
    userId: string
  ): Promise<EnvSnapshot> {
    const variables = await this.getAllVariables(true);
    const flatVariables = Object.values(variables).flat();

    const snapshot = await prisma.$executeRaw`
      INSERT INTO env_snapshots (id, variables, description, created_by, created_at, is_active)
      VALUES (
        ${crypto.randomUUID()},
        ${JSON.stringify(flatVariables)},
        ${description},
        ${userId},
        NOW(),
        false
      )
      RETURNING *
    `;

    return snapshot as unknown as EnvSnapshot;
  }

  /**
   * Restore from snapshot
   */
  static async restoreSnapshot(
    snapshotId: string,
    userId: string
  ): Promise<void> {
    const snapshot = await prisma.$queryRaw`
      SELECT * FROM env_snapshots WHERE id = ${snapshotId}
    ` as EnvSnapshot[];

    if (!snapshot[0]) {
      throw new Error('Snapshot not found');
    }

    // Restore each variable
    for (const variable of snapshot[0].variables) {
      await this.updateVariable(variable.key, variable.value, userId);
    }

    // Mark snapshot as active
    await prisma.$executeRaw`
      UPDATE env_snapshots SET is_active = false WHERE is_active = true;
      UPDATE env_snapshots SET is_active = true WHERE id = ${snapshotId};
    `;

    // Trigger redeployment if Vercel is configured
    if (this.VERCEL_API_TOKEN && this.VERCEL_PROJECT_ID) {
      await this.triggerVercelRedeploy();
    }
  }

  /**
   * Test provider configuration
   */
  static async testProvider(provider: string): Promise<{
    success: boolean;
    message: string;
    models?: string[];
  }> {
    try {
      switch (provider) {
        case 'openai':
          return await this.testOpenAI();
        case 'gemini':
          return await this.testGemini();
        case 'elevenlabs':
          return await this.testElevenLabs();
        case 'livekit':
          return await this.testLiveKit();
        case 'deepgram':
          return await this.testDeepgram();
        case 'hume':
          return await this.testHume();
        case 'paypal':
          return await this.testPayPal();
        case 'myfatoorah':
          return await this.testMyFatoorah();
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Provider test failed'
      };
    }
  }

  /**
   * Check if initial configuration is needed
   */
  static async needsInitialConfiguration(): Promise<boolean> {
    const schema = this.getEnvSchema();
    const requiredKeys = Object.entries(schema)
      .filter(([_, config]) => config.required)
      .map(([key]) => key);

    for (const key of requiredKeys) {
      if (!process.env[key]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get configuration wizard data
   */
  static async getConfigurationWizard(): Promise<{
    steps: Array<{
      title: string;
      category: EnvCategory;
      variables: EnvVariable[];
      completed: boolean;
    }>;
    progress: number;
  }> {
    const grouped = await this.getAllVariables(true);
    const steps = [];
    let totalRequired = 0;
    let totalCompleted = 0;

    for (const [category, variables] of Object.entries(grouped)) {
      const requiredVars = variables.filter(v => v.required);
      if (requiredVars.length > 0) {
        const completed = requiredVars.every(v => v.value && v.value !== '');
        totalRequired += requiredVars.length;
        totalCompleted += requiredVars.filter(v => v.value && v.value !== '').length;
        
        steps.push({
          title: category,
          category: category as EnvCategory,
          variables: requiredVars,
          completed
        });
      }
    }

    return {
      steps,
      progress: totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0
    };
  }

  // Private helper methods

  private static encrypt(value: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.ENCRYPTION_KEY);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private static decrypt(value: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.ENCRYPTION_KEY);
    let decrypted = decipher.update(value, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private static maskSensitiveValue(value: string): string {
    if (value.length <= 8) {
      return '****';
    }
    return value.substring(0, 4) + '****' + value.substring(value.length - 4);
  }

  private static validateValue(value: string, validation: EnvValidation): void {
    switch (validation.type) {
      case 'string':
        if (validation.min && value.length < validation.min) {
          throw new Error(`Value must be at least ${validation.min} characters`);
        }
        if (validation.max && value.length > validation.max) {
          throw new Error(`Value must be at most ${validation.max} characters`);
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          throw new Error(`Value does not match required pattern`);
        }
        if (validation.options && !validation.options.includes(value)) {
          throw new Error(`Value must be one of: ${validation.options.join(', ')}`);
        }
        break;
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error('Value must be a number');
        }
        if (validation.min !== undefined && num < validation.min) {
          throw new Error(`Value must be at least ${validation.min}`);
        }
        if (validation.max !== undefined && num > validation.max) {
          throw new Error(`Value must be at most ${validation.max}`);
        }
        break;
      case 'boolean':
        if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
          throw new Error('Value must be a boolean');
        }
        break;
      case 'url':
        try {
          new URL(value);
        } catch {
          throw new Error('Value must be a valid URL');
        }
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Value must be a valid email address');
        }
        break;
    }
  }

  // Vercel API integration

  private static async updateVercelEnv(key: string, value: string): Promise<void> {
    const url = `https://api.vercel.com/v10/projects/${this.VERCEL_PROJECT_ID}/env`;
    
    await axios.post(url, {
      key,
      value,
      type: 'encrypted',
      target: ['production', 'preview', 'development']
    }, {
      headers: {
        Authorization: `Bearer ${this.VERCEL_API_TOKEN}`,
        ...(this.VERCEL_TEAM_ID && { 'Vercel-Team-Id': this.VERCEL_TEAM_ID })
      }
    });
  }

  private static async deleteVercelEnv(key: string): Promise<void> {
    // First, get the env variable ID
    const listUrl = `https://api.vercel.com/v9/projects/${this.VERCEL_PROJECT_ID}/env`;
    const response = await axios.get(listUrl, {
      headers: {
        Authorization: `Bearer ${this.VERCEL_API_TOKEN}`,
        ...(this.VERCEL_TEAM_ID && { 'Vercel-Team-Id': this.VERCEL_TEAM_ID })
      }
    });

    const envVar = response.data.envs.find((env: any) => env.key === key);
    if (envVar) {
      const deleteUrl = `https://api.vercel.com/v9/projects/${this.VERCEL_PROJECT_ID}/env/${envVar.id}`;
      await axios.delete(deleteUrl, {
        headers: {
          Authorization: `Bearer ${this.VERCEL_API_TOKEN}`,
          ...(this.VERCEL_TEAM_ID && { 'Vercel-Team-Id': this.VERCEL_TEAM_ID })
        }
      });
    }
  }

  private static async triggerVercelRedeploy(): Promise<void> {
    const url = `https://api.vercel.com/v13/deployments`;
    
    await axios.post(url, {
      name: this.VERCEL_PROJECT_ID,
      project: this.VERCEL_PROJECT_ID,
      target: 'production'
    }, {
      headers: {
        Authorization: `Bearer ${this.VERCEL_API_TOKEN}`,
        ...(this.VERCEL_TEAM_ID && { 'Vercel-Team-Id': this.VERCEL_TEAM_ID })
      }
    });
  }

  // Provider test methods

  private static async testOpenAI(): Promise<{ success: boolean; message: string; models?: string[] }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...(process.env.OPENAI_ORG_ID && { 'OpenAI-Organization': process.env.OPENAI_ORG_ID })
      }
    });

    const models = response.data.data
      .filter((m: any) => m.id.startsWith('gpt'))
      .map((m: any) => m.id);

    return {
      success: true,
      message: 'OpenAI connection successful',
      models
    };
  }

  private static async testGemini(): Promise<{ success: boolean; message: string; models?: string[] }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    const models = response.data.models.map((m: any) => m.name);

    return {
      success: true,
      message: 'Gemini connection successful',
      models
    };
  }

  private static async testElevenLabs(): Promise<{ success: boolean; message: string; models?: string[] }> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey
      }
    });

    const voices = response.data.voices.map((v: any) => v.voice_id);

    return {
      success: true,
      message: 'ElevenLabs connection successful',
      models: voices
    };
  }

  private static async testLiveKit(): Promise<{ success: boolean; message: string }> {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !url) {
      throw new Error('LiveKit configuration incomplete');
    }

    // LiveKit doesn't have a simple test endpoint, so we just validate the config
    return {
      success: true,
      message: 'LiveKit configuration validated'
    };
  }

  private static async testDeepgram(): Promise<{ success: boolean; message: string; models?: string[] }> {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('Deepgram API key not configured');
    }

    const response = await axios.get('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${apiKey}`
      }
    });

    return {
      success: true,
      message: 'Deepgram connection successful',
      models: ['nova', 'enhanced', 'base']
    };
  }

  private static async testHume(): Promise<{ success: boolean; message: string }> {
    const apiKey = process.env.HUME_API_KEY;
    const secretKey = process.env.HUME_SECRET_KEY;

    if (!apiKey || !secretKey) {
      throw new Error('Hume configuration incomplete');
    }

    const response = await axios.get('https://api.hume.ai/v0/auth/verify', {
      headers: {
        'X-Hume-Api-Key': apiKey
      }
    });

    return {
      success: true,
      message: 'Hume connection successful'
    };
  }

  private static async testPayPal(): Promise<{ success: boolean; message: string }> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox';

    if (!clientId || !clientSecret) {
      throw new Error('PayPal configuration incomplete');
    }

    const baseUrl = mode === 'production' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const response = await axios.post(
      `${baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
          username: clientId,
          password: clientSecret
        }
      }
    );

    return {
      success: true,
      message: `PayPal ${mode} connection successful`
    };
  }

  private static async testMyFatoorah(): Promise<{ success: boolean; message: string }> {
    const apiKey = process.env.MYFATOORAH_API_KEY;
    const baseUrl = process.env.MYFATOORAH_BASE_URL;

    if (!apiKey || !baseUrl) {
      throw new Error('MyFatoorah configuration incomplete');
    }

    const response = await axios.get(`${baseUrl}/v2/GetPaymentMethods`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return {
      success: true,
      message: 'MyFatoorah connection successful'
    };
  }
}

export default EnvConfigService;